"""
Partner Portal Routes

Rotas para o Portal do Parceiro (fotógrafos/estúdios).
Protegidas pela role 'photographer' - mesmo app web, rota /partner.

Fluxo:
1. Cadastro via /pro (landing page) -> aprovação manual
2. Compra de créditos (pacotes de vouchers)
3. Cria entregas com upload client-side
4. Gera voucher + cartão digital
5. Acompanha resgates no dashboard
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.deps import get_db
from babybook_api.auth.session import UserSession, get_current_user, require_csrf_token
from babybook_api.db.models import Partner, Delivery, Voucher, DeliveryAsset, User, PartnerLedger
from babybook_api.schemas.partner_portal import (
    PartnerOnboardingRequest,
    PartnerOnboardingResponse,
    PartnerProfileResponse,
    PartnerProfileUpdateRequest,
    PartnerDashboardStatsResponse,
    CreditPackage,
    PurchaseCreditsRequest,
    PurchaseCreditsResponse,
    CreateDeliveryRequest,
    DeliveryResponse,
    DeliveryDetailResponse,
    DeliveryListResponse,
    DeliveryAggregationsResponse,
    GenerateVoucherCardRequest,
    VoucherCardResponse,
    UploadInitRequest,
    UploadInitResponse,
    UploadCompleteRequest,
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    CheckAccessResponse,
    ChildInfo,
)
from babybook_api.storage import (
    tmp_upload_path,
    get_partner_storage,
    PartnerStorageService,
)
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.request_ip import get_client_ip
from babybook_api.settings import settings

router = APIRouter()


# =============================================================================
# Helpers
# =============================================================================

def generate_voucher_code(prefix: str = "BABY") -> str:
    """Gera código de voucher único no formato PREFIX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"{prefix}-{part1}-{part2}"


def generate_slug(name: str) -> str:
    """Gera slug a partir do nome"""
    import re
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return f"{slug}-{secrets.token_hex(4)}"


async def get_partner_for_user(db: AsyncSession, user: UserSession) -> Partner:
    """Busca o Partner associado ao usuário com role photographer"""
    if user.role not in ("photographer", "admin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a parceiros"
        )
    
    result = await db.execute(
        select(Partner).where(Partner.user_id == user.id)
    )
    partner = result.scalar_one_or_none()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de parceiro não encontrado"
        )
    
    if partner.status == "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seu cadastro está aguardando aprovação"
        )
    
    if partner.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de parceiro inativa"
        )
    
    return partner


# =============================================================================
# Credit Packages (Pacotes de Créditos)
# =============================================================================

# Regra de pricing (docs: Modelagem_Produto / Arquitetura_do_Sistema):
# - PIX deve ser mais barato (à vista) e recomendado.
# - Cartão existe por conveniência; preço maior para absorver custo do parcelamento.
# - Subsidiamos apenas até 3x sem juros.
PIX_DISCOUNT_PER_VOUCHER_CENTS = 1400  # R$ 14,00 por voucher (ex.: 149 -> 135 no lote 10)
MAX_INSTALLMENTS_NO_INTEREST = 3


def _pix_price_cents_for(package: CreditPackage) -> int:
    return max(0, package.price_cents - (package.voucher_count * PIX_DISCOUNT_PER_VOUCHER_CENTS))

CREDIT_PACKAGES: list[CreditPackage] = [
    CreditPackage(
        id="pack_5",
        name="Pacote Inicial",
        voucher_count=5,
        price_cents=85000,  # R$ 850 (cartão)
        pix_price_cents=85000 - (5 * PIX_DISCOUNT_PER_VOUCHER_CENTS),  # R$ 780 (PIX)
        unit_price_cents=17000,  # R$ 170/unid
        savings_percent=0,
    ),
    CreditPackage(
        id="pack_10",
        name="Pacote Profissional",
        voucher_count=10,
        price_cents=149000,  # R$ 1.490 (cartão)
        pix_price_cents=149000 - (10 * PIX_DISCOUNT_PER_VOUCHER_CENTS),  # R$ 1.350 (PIX)
        unit_price_cents=14900,  # R$ 149/unid
        savings_percent=12,
        is_popular=True,
    ),
    CreditPackage(
        id="pack_25",
        name="Pacote Estúdio",
        voucher_count=25,
        price_cents=322500,  # R$ 3.225 (cartão)
        pix_price_cents=322500 - (25 * PIX_DISCOUNT_PER_VOUCHER_CENTS),  # R$ 2.875 (PIX)
        unit_price_cents=12900,  # R$ 129/unid
        savings_percent=24,
    ),
]


# =============================================================================
# Onboarding (Cadastro do Fotógrafo)
# =============================================================================

@router.post(
    "/onboarding",
    response_model=PartnerOnboardingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastro de novo parceiro (fotógrafo)",
    description="""
    Cadastro inicial do fotógrafo via landing page /pro.
    Cria User com role 'photographer' e Partner associado.
    Status inicial: pending_approval (requer aprovação manual).
    """,
)
async def partner_onboarding(
    request: PartnerOnboardingRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
) -> PartnerOnboardingResponse:
    """Cadastro de novo parceiro (fotógrafo)."""
    # Rate Limit: 5 por hora por IP (evita spam de contas)
    await enforce_rate_limit(
        bucket="partner:onboarding:ip",
        limit="5/hour",
        identity=get_client_ip(req)
    )

    # Normaliza email para evitar duplicidade por variação de caixa/espaços
    normalized_email = request.email.strip().lower()
    
    # Verifica se email já existe
    existing_user = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado"
        )
    
    existing_partner = await db.execute(
        select(Partner).where(Partner.email == normalized_email)
    )
    if existing_partner.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado como parceiro"
        )
    
    # Cria User com role photographer
    from babybook_api.services.auth import hash_password
    
    user = User(
        id=uuid4(),
        email=normalized_email,
        password_hash=hash_password(request.password),
        name=request.name,
        role="photographer",
    )
    db.add(user)
    
    # Cria Partner associado
    partner = Partner(
        id=uuid4(),
        user_id=user.id,
        name=request.name,
        email=normalized_email,
        slug=generate_slug(request.studio_name or request.name),
        company_name=request.studio_name,
        phone=request.phone,
        status="pending_approval",
        voucher_balance=0,
    )
    db.add(partner)

    # Proteção extra contra corrida: se houver UNIQUE constraint no banco,
    # evita 500 e retorna mensagem amigável.
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este e-mail já está cadastrado"
        )
    
    return PartnerOnboardingResponse(
        success=True,
        message="Cadastro realizado com sucesso! Aguarde a aprovação.",
        partner_id=str(partner.id),
        status="pending_approval",
    )


# =============================================================================
# Profile & Dashboard
# =============================================================================

@router.get(
    "/me",
    response_model=PartnerProfileResponse,
    summary="Perfil do parceiro logado",
)
async def get_partner_profile(
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> PartnerProfileResponse:
    """Retorna o perfil do parceiro logado."""
    partner = await get_partner_for_user(db, current_user)
    
    return PartnerProfileResponse(
        id=str(partner.id),
        name=partner.name,
        email=partner.email,
        studio_name=partner.company_name,
        phone=partner.phone,
        logo_url=partner.logo_url,
        voucher_balance=partner.voucher_balance,
        status=partner.status,
        created_at=partner.created_at,
    )


@router.patch(
    "/me",
    response_model=PartnerProfileResponse,
    summary="Atualiza perfil do parceiro",
)
async def update_partner_profile(
    request: PartnerProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> PartnerProfileResponse:
    """Atualiza o perfil do parceiro logado."""
    await enforce_rate_limit(bucket="partner:profile:update:user", limit="10/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)
    
    # Atualiza campos se fornecidos
    if request.name is not None:
        partner.name = request.name
    if request.studio_name is not None:
        partner.company_name = request.studio_name
    if request.phone is not None:
        partner.phone = request.phone
    if request.logo_url is not None:
        partner.logo_url = request.logo_url
    
    await db.commit()
    await db.refresh(partner)
    
    return PartnerProfileResponse(
        id=str(partner.id),
        name=partner.name,
        email=partner.email,
        studio_name=partner.company_name,
        phone=partner.phone,
        logo_url=partner.logo_url,
        voucher_balance=partner.voucher_balance,
        status=partner.status,
        created_at=partner.created_at,
    )


@router.get(
    "/me/stats",
    response_model=PartnerDashboardStatsResponse,
    summary="Estatísticas do dashboard",
)
async def get_partner_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> PartnerDashboardStatsResponse:
    """Estatísticas para o dashboard do parceiro."""
    partner = await get_partner_for_user(db, current_user)
    
    # Conta entregas
    deliveries_result = await db.execute(
        select(
            func.count(Delivery.id).label("total"),
            func.count(Delivery.id).filter(Delivery.status == "ready").label("ready"),
            func.count(Delivery.id).filter(Delivery.status == "delivered").label("delivered"),
            func.count(Delivery.id)
            .filter(and_(Delivery.credit_status == "reserved", Delivery.archived_at.is_(None)))
            .label("reserved"),
        ).where(Delivery.partner_id == partner.id)
    )
    deliveries_stats = deliveries_result.one()
    
    # Conta vouchers
    vouchers_result = await db.execute(
        select(
            func.count(Voucher.id).label("total"),
            func.count(Voucher.id).filter(Voucher.status == "redeemed").label("redeemed"),
        ).where(Voucher.partner_id == partner.id)
    )
    vouchers_stats = vouchers_result.one()
    
    # Conta assets
    assets_result = await db.execute(
        select(func.count(DeliveryAsset.id)).where(
            DeliveryAsset.delivery_id.in_(
                select(Delivery.id).where(Delivery.partner_id == partner.id)
            )
        )
    )
    total_assets = assets_result.scalar() or 0
    
    return PartnerDashboardStatsResponse(
        voucher_balance=partner.voucher_balance,
        reserved_credits=int(deliveries_stats.reserved or 0),
        total_deliveries=deliveries_stats.total,
        ready_deliveries=deliveries_stats.ready,
        delivered_deliveries=deliveries_stats.delivered,
        total_vouchers=vouchers_stats.total,
        redeemed_vouchers=vouchers_stats.redeemed,
        pending_vouchers=vouchers_stats.total - vouchers_stats.redeemed,
        total_assets=total_assets,
    )


# =============================================================================
# Check Client Access (verificação de acesso do cliente)
# =============================================================================

@router.get(
    "/check-access",
    response_model=CheckAccessResponse,
    summary="Verifica se cliente já tem acesso ao Baby Book",
    description="""
    Verifica se um e-mail já tem conta no Baby Book.
    Se tiver, a entrega não consome crédito.
    
    Regras de negócio:
    - 1 crédito = 1 filho com acesso vitalício
    - Cliente recorrente (mesmo filho) = grátis
    - Cliente de outro fotógrafo = grátis
    """,
)
async def check_client_access(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> CheckAccessResponse:
    """Verifica se cliente já tem acesso ao Baby Book."""
    await enforce_rate_limit(bucket="partner:check-access:user", limit="60/minute", identity=current_user.id)
    # Garante que é um parceiro válido
    await get_partner_for_user(db, current_user)
    
    # Busca usuário pelo email
    normalized_email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    
    if user:
        # Usuário existe - tem acesso (pode ser B2C ou via outro fotógrafo)
        # TODO: Buscar filhos/contas do usuário quando o modelo permitir
        return CheckAccessResponse(
            has_access=True,
            email=normalized_email,
            # Evita expor PII (nome) e reduzir enumeração via API
            client_name=None,
            children=[],  # TODO: Popular com filhos reais do usuário
            message=f"Cliente já possui acesso ao Baby Book. Esta entrega não consumirá crédito.",
        )
    else:
        # Usuário não existe - novo cliente
        return CheckAccessResponse(
            has_access=False,
            email=normalized_email,
            client_name=None,
            children=[],
            message="Novo cliente. Um crédito será consumido para criar o acesso.",
        )


# =============================================================================
# Credit Purchase (Compra de Créditos)
# =============================================================================

@router.get(
    "/credits/packages",
    response_model=list[CreditPackage],
    summary="Lista pacotes de créditos disponíveis",
)
async def list_credit_packages() -> list[CreditPackage]:
    """Lista os pacotes de créditos disponíveis para compra."""
    return CREDIT_PACKAGES


@router.post(
    "/credits/purchase",
    response_model=PurchaseCreditsResponse,
    summary="Compra pacote de créditos",
    description="""
    Inicia a compra de um pacote de créditos.
    Retorna URL do checkout (Stripe/Pagar.me).
    Após pagamento, webhook atualiza voucher_balance.
    """,
)
async def purchase_credits(
    request: PurchaseCreditsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> PurchaseCreditsResponse:
    """Inicia compra de pacote de créditos."""
    await enforce_rate_limit(bucket="partner:credits:purchase:user", limit="10/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)
    
    # Busca pacote
    package = next((p for p in CREDIT_PACKAGES if p.id == request.package_id), None)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pacote não encontrado"
        )
    
    payment_method = request.payment_method
    if payment_method == "pix":
        amount_cents = package.pix_price_cents if package.pix_price_cents is not None else _pix_price_cents_for(package)
    else:
        amount_cents = package.price_cents

    # TODO: Integrar com Stripe/Pagar.me
    # Por enquanto, simula checkout
    checkout_id = f"chk_{uuid4().hex[:16]}"

    # Em produção: criar sessão de checkout no gateway
    # e retornar a URL do gateway
    checkout_url = (
        f"/partner/checkout/{checkout_id}?package={package.id}"
        f"&method={payment_method}"
        f"&amount_cents={amount_cents}"
    )

    return PurchaseCreditsResponse(
        checkout_id=checkout_id,
        checkout_url=checkout_url,
        package=package,
        payment_method=payment_method,
        amount_cents=amount_cents,
        max_installments_no_interest=MAX_INSTALLMENTS_NO_INTEREST,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )


@router.post(
    "/credits/confirm/{checkout_id}",
    summary="Confirma compra de créditos (webhook/sandbox)",
    description="Endpoint para confirmar pagamento. Em produção, chamado via webhook.",
)
async def confirm_credit_purchase(
    checkout_id: str,
    package_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> dict:
    """Confirma compra e adiciona créditos (sandbox/dev)."""
    # Em produção, este endpoint deve ser substituído por webhook assinado do gateway.
    if settings.app_env != "local":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Confirmação manual de créditos permitida apenas em ambiente local"
        )
    partner = await get_partner_for_user(db, current_user)
    
    package = next((p for p in CREDIT_PACKAGES if p.id == package_id), None)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pacote não encontrado"
        )
    
    # Adiciona créditos com lock para evitar corrida
    result = await db.execute(
        select(Partner).where(Partner.id == partner.id).with_for_update()
    )
    locked_partner = result.scalar_one()
    locked_partner.voucher_balance += package.voucher_count
    await db.commit()
    
    return {
        "success": True,
        "credits_added": package.voucher_count,
        "new_balance": locked_partner.voucher_balance,
    }


# =============================================================================
# Deliveries (Entregas)
# =============================================================================

def _normalize_partner_delivery_status(raw_status: str | None) -> str:
    """Normaliza status legados para o vocabulário do partner portal."""
    if not raw_status:
        return "draft"
    # Em outras rotas do sistema, 'completed' é usado para entrega resgatada.
    if raw_status == "completed":
        return "delivered"
    return raw_status

@router.post(
    "/deliveries",
    response_model=DeliveryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria nova entrega",
    description="""
    Cria uma nova entrega para um cliente.
    
    **Regras de crédito (Golden Record / Late Binding):**
    - Sempre reserva 1 crédito na criação da entrega (debita voucher_balance)
    - No resgate do voucher, o cliente escolhe:
      - NEW_CHILD: consome a reserva
      - EXISTING_CHILD: estorna a reserva (+1)
    
    Retorna delivery_id para fazer upload dos assets.
    """,
)
async def create_delivery(
    request: CreateDeliveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> DeliveryResponse:
    """Cria nova entrega com reserva de crédito (late binding)."""
    await enforce_rate_limit(bucket="partner:deliveries:create:user", limit="30/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)

    # Reserva 1 crédito sob lock transacional (evita condição de corrida/double-spend)
    result = await db.execute(
        select(Partner).where(Partner.id == partner.id).with_for_update()
    )
    locked_partner = result.scalar_one()
    if locked_partner.voucher_balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Saldo insuficiente. Compre mais créditos.",
        )
    locked_partner.voucher_balance -= 1
    
    # Cria delivery
    title = request.title or f"Ensaio - {request.child_name or request.client_name}"
    delivery = Delivery(
        id=uuid4(),
        partner_id=partner.id,
        title=title,
        client_name=request.client_name,
        description=request.description,
        event_date=request.event_date,
        status="draft",
        credit_status="reserved",
        assets_payload={
            "files": [],
            "upload_started": False,
            "client_email": request.client_email,
            "child_name": request.child_name,
            "credit_reserved": True,
        },
    )
    db.add(delivery)

    db.add(
        PartnerLedger(
            id=uuid4(),
            partner_id=partner.id,
            amount=-1,
            type="reservation",
            description=f"reservation delivery={delivery.id}",
        )
    )
    
    await db.commit()
    await db.refresh(delivery)
    
    return DeliveryResponse(
        id=str(delivery.id),
        title=delivery.title,
        client_name=delivery.client_name,
        status=delivery.status,
        credit_status=delivery.credit_status,
        assets_count=0,
        voucher_code=None,
        created_at=delivery.created_at,
    )


@router.get(
    "/deliveries",
    response_model=DeliveryListResponse,
    summary="Lista entregas do parceiro",
)
async def list_partner_deliveries(
    status_filter: Optional[str] = None,
    include_archived: bool = False,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> DeliveryListResponse:
    """Lista entregas do parceiro."""
    partner = await get_partner_for_user(db, current_user)

    base_where = [Delivery.partner_id == partner.id]
    active_where = [*base_where, Delivery.archived_at.is_(None)]
    archived_where = [*base_where, Delivery.archived_at.is_not(None)]

    # Agregações (independentes de status_filter/limit/offset)
    total_all = (await db.execute(select(func.count(Delivery.id)).where(*base_where))).scalar() or 0
    archived_count = (await db.execute(select(func.count(Delivery.id)).where(*archived_where))).scalar() or 0

    by_status_rows = (
        await db.execute(
            select(Delivery.status, func.count(Delivery.id))
            .where(*active_where)
            .group_by(Delivery.status)
        )
    ).all()
    by_status: dict[str, int] = {}
    for raw_status, count in by_status_rows:
        normalized = _normalize_partner_delivery_status(raw_status)
        by_status[normalized] = by_status.get(normalized, 0) + int(count or 0)
    
    query = select(Delivery).where(*base_where)
    
    # Por padrão, não mostra entregas arquivadas
    if not include_archived:
        query = query.where(Delivery.archived_at.is_(None))
    
    if status_filter:
        # Normaliza filtro do frontend (ex.: delivered) para possíveis valores no banco.
        if status_filter == "delivered":
            query = query.where(Delivery.status.in_(["delivered", "completed"]))
        else:
            query = query.where(Delivery.status == status_filter)
    
    query = query.order_by(Delivery.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    deliveries = result.scalars().all()
    
    # Conta total (respeitando filtros)
    count_query = select(func.count(Delivery.id)).where(*base_where)
    if not include_archived:
        count_query = count_query.where(Delivery.archived_at.is_(None))
    if status_filter:
        if status_filter == "delivered":
            count_query = count_query.where(Delivery.status.in_(["delivered", "completed"]))
        else:
            count_query = count_query.where(Delivery.status == status_filter)
    total = (await db.execute(count_query)).scalar() or 0
    
    return DeliveryListResponse(
        deliveries=[
            DeliveryResponse(
                id=str(d.id),
                title=d.title,
                client_name=d.client_name,
                status=_normalize_partner_delivery_status(d.status),
                credit_status=d.credit_status,
                is_archived=d.archived_at is not None,
                archived_at=d.archived_at,
                assets_count=len(d.assets_payload.get("files", [])) if d.assets_payload else 0,
                voucher_code=d.generated_voucher_code,
                created_at=d.created_at,
                redeemed_at=d.assets_transferred_at,
                redeemed_by=d.beneficiary_email,
            )
            for d in deliveries
        ],
        total=total,
        aggregations=DeliveryAggregationsResponse(
            total=total_all,
            archived=archived_count,
            by_status=by_status,
        ),
    )


@router.get(
    "/deliveries/{delivery_id}",
    response_model=DeliveryDetailResponse,
    summary="Detalhes de uma entrega",
)
async def get_delivery_detail(
    delivery_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> DeliveryDetailResponse:
    """Retorna detalhes de uma entrega."""
    partner = await get_partner_for_user(db, current_user)
    
    result = await db.execute(
        select(Delivery)
        .options(selectinload(Delivery.voucher))
        .where(and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id))
    )
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega não encontrada"
        )
    
    assets_payload = delivery.assets_payload or {}
    files = assets_payload.get("files", [])
    
    return DeliveryDetailResponse(
        id=str(delivery.id),
        title=delivery.title,
        client_name=delivery.client_name,
        description=delivery.description,
        event_date=delivery.event_date,
        status=_normalize_partner_delivery_status(delivery.status),
        credit_status=delivery.credit_status,
        is_archived=delivery.archived_at is not None,
        archived_at=delivery.archived_at,
        assets_count=len(files),
        assets=files,
        voucher_code=delivery.generated_voucher_code,
        created_at=delivery.created_at,
        redeemed_at=delivery.assets_transferred_at,
        redeemed_by=delivery.beneficiary_email,
    )


@router.patch(
    "/deliveries/{delivery_id}/archive",
    summary="Arquiva ou desarquiva uma entrega",
    description="""
    Arquiva uma entrega (soft delete do fotógrafo).
    
    **IMPORTANTE:** Isso só oculta a entrega da listagem do fotógrafo.
    O cliente continua tendo acesso às fotos normalmente.
    
    Para desarquivar, chame novamente com archive=false.
    """,
)
async def archive_delivery(
    delivery_id: str,
    archive: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> dict:
    """Arquiva ou desarquiva uma entrega."""
    await enforce_rate_limit(bucket="partner:deliveries:archive:user", limit="30/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)
    
    result = await db.execute(
        select(Delivery).where(
            and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id)
        )
    )
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega não encontrada"
        )
    
    if archive:
        delivery.archived_at = datetime.utcnow()
    else:
        delivery.archived_at = None
    
    await db.commit()
    
    return {
        "success": True,
        "archived": archive,
        "message": "Entrega arquivada" if archive else "Entrega desarquivada",
    }


# =============================================================================
# Upload (Client-Side Direct Upload)
# =============================================================================

@router.post(
    "/deliveries/{delivery_id}/upload/init",
    response_model=UploadInitResponse,
    summary="Inicia upload de arquivo",
    description="""
    Retorna URL presigned para upload direto ao R2.
    Fotógrafo faz upload do arquivo comprimido diretamente.
    
    Arquivos vão para tmp/uploads/ inicialmente.
    Após confirmação, são movidos para partners/{partner_id}/{delivery_id}/.
    """,
)
async def init_upload(
    delivery_id: str,
    request: UploadInitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    storage: PartnerStorageService = Depends(get_partner_storage),
    _: None = Depends(require_csrf_token),
) -> UploadInitResponse:
    """Inicia upload de arquivo para entrega."""
    await enforce_rate_limit(bucket="partner:deliveries:upload:init:user", limit="60/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)
    
    result = await db.execute(
        select(Delivery).where(
            and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id)
        )
    )
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega não encontrada"
        )
    
    if delivery.status not in ("draft", "pending_upload"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entrega não aceita mais uploads"
        )
    
    # Valida content_type permitido
    if not request.is_valid_content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido: {request.content_type}. Apenas imagens e vídeos são aceitos."
        )
    
    # Usa PartnerStorageService para preparar upload
    # Arquivos vão para tmp/uploads/ primeiro (lifecycle de 1 dia)
    upload_info = await storage.init_partner_upload(
        partner_id=str(partner.id),
        delivery_id=delivery_id,
        # Usa o filename original; o storage aplica secure_filename de forma consistente
        filename=request.filename,
        content_type=request.content_type,
        size_bytes=request.size_bytes,
    )
    
    # Atualiza status sem sobrescrever metadados existentes em assets_payload
    if delivery.status == "draft":
        delivery.status = "pending_upload"

    assets_payload = delivery.assets_payload or {}
    assets_payload.setdefault("files", [])
    assets_payload["upload_started"] = True
    delivery.assets_payload = assets_payload
    
    await db.commit()
    
    return UploadInitResponse(
        upload_id=upload_info.upload_id,
        upload_url=upload_info.presigned_url,
        key=upload_info.key,
        expires_at=upload_info.expires_at,
    )


@router.post(
    "/deliveries/{delivery_id}/upload/complete",
    summary="Confirma upload de arquivo",
    description="""
    Move arquivo de tmp/uploads/ para partners/{partner_id}/{delivery_id}/.
    Após confirmação, arquivo sai do lifecycle de 1 dia.
    """,
)
async def complete_upload(
    delivery_id: str,
    request: UploadCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    storage: PartnerStorageService = Depends(get_partner_storage),
    _: None = Depends(require_csrf_token),
) -> dict:
    """Confirma que o upload foi concluído e move para pasta permanente."""
    await enforce_rate_limit(bucket="partner:deliveries:upload:complete:user", limit="120/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)
    
    result = await db.execute(
        select(Delivery).where(
            and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id)
        )
    )
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega não encontrada"
        )
    
    # Valida que a key recebida bate com o upload_id + filename esperado.
    # Isso reduz risco de "swap" de key/filename para copiar um objeto diferente.
    try:
        expected_tmp_key = tmp_upload_path(request.upload_id, request.filename).path
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="upload_id ou filename inválido"
        )

    if request.key != expected_tmp_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Key do upload não corresponde ao arquivo esperado"
        )

    # Validação server-side do objeto em tmp/ antes de promover para partners/.
    # Protege contra:
    # - Content-Type spoofing (ex.: executável disfarçado de JPG)
    # - Upload de arquivo maior do que o declarado/permitido
    try:
        await storage.validate_tmp_upload(
            tmp_key=expected_tmp_key,
            declared_content_type=request.content_type or "application/octet-stream",
            declared_size_bytes=request.size_bytes,
            max_size_bytes=MAX_UPLOAD_SIZE_BYTES,
            allowed_content_types=set(ALLOWED_CONTENT_TYPES),
        )
    except Exception as exc:
        # PartnerUploadValidationError carrega status_code próprio, mas evitamos
        # acoplar o router diretamente a esse tipo.
        status_code = getattr(exc, "status_code", None)
        message = str(exc) or "Arquivo inválido"
        if isinstance(status_code, int):
            raise HTTPException(status_code=status_code, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Move arquivo de tmp/ para partners/ usando server-side copy
    final_path = await storage.confirm_partner_upload(
        partner_id=str(partner.id),
        delivery_id=delivery_id,
        upload_id=request.upload_id,
        filename=request.filename,
        content_type=request.content_type or "application/octet-stream",
    )
    
    # Adiciona arquivo à lista
    assets_payload = delivery.assets_payload or {"files": []}
    assets_payload.setdefault("files", [])
    assets_payload["files"].append({
        "upload_id": request.upload_id,
        "key": final_path.path,  # Usa a key final, não a temporária
        "original_filename": request.filename,
        "content_type": request.content_type,
        "size_bytes": request.size_bytes,
        "uploaded_at": datetime.utcnow().isoformat(),
    })
    delivery.assets_payload = assets_payload
    
    await db.commit()
    
    return {
        "success": True,
        "files_count": len(assets_payload["files"]),
        "key": final_path.path,
    }


@router.post(
    "/deliveries/{delivery_id}/finalize",
    response_model=VoucherCardResponse,
    summary="Finaliza entrega e gera voucher",
    description="""
    Finaliza a entrega após todos os uploads.
    Gera voucher com código único e dados para o cartão digital.
    """,
)
async def finalize_delivery(
    delivery_id: str,
    request: GenerateVoucherCardRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> VoucherCardResponse:
    """Finaliza entrega e gera voucher + dados do cartão."""
    partner = await get_partner_for_user(db, current_user)
    
    result = await db.execute(
        select(Delivery).where(
            and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id)
        )
    )
    delivery = result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega não encontrada"
        )
    
    if delivery.status not in ("draft", "pending_upload"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entrega já foi finalizada"
        )
    
    # Verifica se tem arquivos
    assets_payload = delivery.assets_payload or {"files": []}
    if not assets_payload.get("files"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adicione pelo menos um arquivo antes de finalizar"
        )
    
    # Gera código do voucher
    prefix = request.voucher_prefix or partner.company_name or partner.name
    prefix = prefix[:8].upper().replace(" ", "")
    voucher_code = generate_voucher_code(prefix)
    
    # Cria voucher
    voucher = Voucher(
        id=uuid4(),
        partner_id=partner.id,
        code=voucher_code,
        status="available",
        delivery_id=delivery.id,
        expires_at=datetime.utcnow() + timedelta(days=request.expires_days or 365),
        uses_limit=1,
    )
    db.add(voucher)
    
    # Atualiza delivery
    delivery.generated_voucher_code = voucher_code
    delivery.status = "ready"
    delivery.beneficiary_name = request.beneficiary_name
    
    await db.commit()
    
    # Retorna dados para gerar o cartão no frontend
    redeem_url = f"https://babybook.com.br/resgatar?code={voucher_code}"
    qr_data = redeem_url
    
    return VoucherCardResponse(
        voucher_code=voucher_code,
        redeem_url=redeem_url,
        qr_data=qr_data,
        studio_name=partner.company_name or partner.name,
        studio_logo_url=partner.logo_url,
        beneficiary_name=request.beneficiary_name,
        message=request.message or f"O {partner.company_name or partner.name} preparou um presente especial para você!",
        assets_count=len(assets_payload["files"]),
        expires_at=voucher.expires_at,
    )


# =============================================================================
# Notifications (Avisar quando resgate acontecer)
# =============================================================================

@router.get(
    "/notifications/unread",
    summary="Lista notificações não lidas",
)
async def get_unread_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> list[dict]:
    """Lista notificações de resgates não lidas."""
    partner = await get_partner_for_user(db, current_user)
    
    # Busca resgates recentes (últimos 7 dias)
    recent_redemptions = await db.execute(
        select(Delivery)
        .where(
            and_(
                Delivery.partner_id == partner.id,
                Delivery.status == "delivered",
                Delivery.assets_transferred_at >= datetime.utcnow() - timedelta(days=7),
            )
        )
        .order_by(Delivery.assets_transferred_at.desc())
        .limit(10)
    )
    
    deliveries = recent_redemptions.scalars().all()
    
    return [
        {
            "id": str(d.id),
            "type": "redemption",
            "title": f"🎉 {d.client_name or 'Cliente'} resgatou o presente!",
            "message": f"Resgatado por {d.beneficiary_email or 'cliente'} em {d.assets_transferred_at.strftime('%d/%m/%Y às %H:%M')}",
            "delivery_id": str(d.id),
            "created_at": d.assets_transferred_at.isoformat(),
        }
        for d in deliveries
    ]
