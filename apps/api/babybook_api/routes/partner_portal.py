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

import secrets
import string
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import (
    UserSession,
    get_current_user,
    require_csrf_token,
)
from babybook_api.db.models import (
    Child,
    Delivery,
    DeliveryAsset,
    Partner,
    PartnerLedger,
    User,
    Voucher,
)
from babybook_api.deps import get_db
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.request_ip import get_client_ip
from babybook_api.schemas.partner_portal import (
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    CheckAccessResponse,
    CheckEligibilityRequest,
    CheckEligibilityResponse,
    ChildInfo,
    CreateDeliveryRequest,
    CreditPackage,
    DeliveryAggregationsResponse,
    DeliveryDetailResponse,
    DeliveryListResponse,
    DeliveryResponse,
    GenerateVoucherCardRequest,
    PartnerDashboardStatsResponse,
    PartnerOnboardingRequest,
    PartnerOnboardingResponse,
    PartnerProfileResponse,
    PartnerProfileUpdateRequest,
    PurchaseCreditsRequest,
    PurchaseCreditsResponse,
    UpdateDeliveryRequest,
    UploadCompleteRequest,
    UploadInitRequest,
    UploadInitResponse,
    VoucherCardResponse,
)
from babybook_api.settings import settings
from babybook_api.storage import (
    PartnerStorageService,
    get_partner_storage,
    tmp_upload_path,
)

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
    
    # UserSession.id é string; no banco, Partner.user_id é UUID.
    # Em SQLite (tests) o binder de UUID não aceita string -> convertemos.
    result = await db.execute(
        select(Partner).where(Partner.user_id == UUID(user.id))
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
            func.count(Delivery.id).filter(Delivery.status == "completed").label("delivered"),
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


# =============================================================================
# Check Eligibility (validação silenciosa)
# =============================================================================


@router.post(
    "/check-eligibility",
    response_model=CheckEligibilityResponse,
    summary="Valida elegibilidade silenciosa para entrega direta",
    description=(
        "Retorna apenas um booleano de elegibilidade. "
        "Elegível = cliente existe e possui pelo menos 1 Child com PCE pago (pce_status='paid'). "
        "Não retorna nomes nem lista de filhos."
    ),
)
async def check_eligibility(
    body: CheckEligibilityRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> CheckEligibilityResponse:
    # Rate limit mais estrito (silencioso no UI, mas protege enumeração)
    await enforce_rate_limit(
        bucket="partner:check-eligibility:user",
        limit="60/minute",
        identity=current_user.id,
    )
    await enforce_rate_limit(
        bucket="partner:check-eligibility:ip",
        limit="200/hour",
        identity=get_client_ip(req),
    )

    # Garante que é um parceiro válido
    await get_partner_for_user(db, current_user)

    normalized_email = body.email.strip().lower()

    user = await db.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        return CheckEligibilityResponse(is_eligible=False, reason="NEW_USER")

    paid_child_count = await db.scalar(
        select(func.count(Child.id)).where(
            Child.account_id == user.account_id,
            Child.deleted_at.is_(None),
            Child.pce_status == "paid",
        )
    )

    if int(paid_child_count or 0) > 0:
        return CheckEligibilityResponse(is_eligible=True, reason="EXISTING_ACTIVE_CHILD")
    return CheckEligibilityResponse(is_eligible=False, reason="NEW_USER")

@router.get(
    "/check-access",
    response_model=CheckAccessResponse,
    summary="Verifica se cliente já tem acesso ao Baby Book",
    description="""
    Verifica se um e-mail já tem conta no Baby Book.
    Se tiver conta, o fotógrafo pode criar uma entrega sem voucher (direct import).
    O custo (se houver) é decidido na importação, por criança (late binding).
    
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
    
    if not user:
        # Usuário não existe - novo cliente
        return CheckAccessResponse(
            has_access=False,
            email=normalized_email,
            client_name=None,
            children=[],
            message="Novo cliente (sem conta). Será necessário gerar voucher para onboarding. Se o cliente criar um novo Filho, custa 1 crédito.",
        )

    # Usuário existe (cliente já está na plataforma). Listamos filhos e o acesso é por criança.
    rows = await db.execute(
        select(Child)
        .where(
            Child.account_id == user.account_id,
            Child.deleted_at.is_(None),
        )
        .order_by(Child.created_at.asc())
        .limit(50)
    )
    all_children = rows.scalars().all()

    children = [
        ChildInfo(id=str(c.id), name=c.name, has_access=(c.pce_status == "paid"))
        for c in all_children
    ]

    has_paid_child = any(c.pce_status == "paid" for c in all_children)

    if has_paid_child:
        msg = "Cliente já tem conta e pelo menos 1 Filho com acesso. Entrega para esse Filho é grátis; para novo Filho custa 1 crédito."
    else:
        msg = "Cliente já tem conta, mas ainda não tem Filho com acesso. Se importar criando um novo Filho, custa 1 crédito."

    return CheckAccessResponse(
        # Mantemos o campo por compatibilidade com o frontend: aqui significa "cliente já tem conta".
        has_access=True,
        email=normalized_email,
        # Evita expor PII (nome) e reduzir enumeração via API
        client_name=None,
        children=children,
        message=msg,
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
    await get_partner_for_user(db, current_user)
    
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
    # Em outras rotas do sistema, alguns status diferem do vocabulário do partner portal.
    # - completed: entrega já foi resgatada/importada pelo cliente
    # - pending: job enfileirado/aguardando processamento (equivale a "processing" no portal)
    # - failed: falha no pipeline (mantemos explícito para permitir UI sinalizar erro)
    if raw_status == "completed":
        return "delivered"
    if raw_status == "pending":
        return "processing"
    if raw_status == "failed":
        return "failed"
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
    """Cria nova entrega.

    Regra (Entrega Direta com Validação Silenciosa):
    - Elegível (cliente já tem >=1 Child pago): custo 0 na criação
    - Caso contrário: reserva 1 crédito na criação

    Observação: o hard lock do resgate é por e-mail (`Delivery.target_email`).
    """
    await enforce_rate_limit(bucket="partner:deliveries:create:user", limit="30/minute", identity=current_user.id)
    partner = await get_partner_for_user(db, current_user)

    normalized_target_email: str = request.target_email.strip().lower()

    # Elegibilidade = existe usuário + pelo menos 1 Child com PCE pago.
    existing_user = await db.scalar(select(User).where(User.email == normalized_target_email))
    existing_target_account_id = existing_user.account_id if existing_user is not None else None

    has_paid_child = False
    if existing_user is not None:
        paid_child_count = await db.scalar(
            select(func.count(Child.id)).where(
                Child.account_id == existing_user.account_id,
                Child.deleted_at.is_(None),
                Child.pce_status == "paid",
            )
        )
        has_paid_child = int(paid_child_count or 0) > 0

    credit_status = "not_required" if has_paid_child else "reserved"
    credit_reserved = not has_paid_child

    if credit_reserved:
        # Reserva 1 crédito sob lock transacional (evita condição de corrida/double-spend)
        result = await db.execute(select(Partner).where(Partner.id == partner.id).with_for_update())
        locked_partner = result.scalar_one()
        if locked_partner.voucher_balance < 1:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Saldo insuficiente. Compre mais créditos.",
            )
        locked_partner.voucher_balance -= 1
    
    # Cria delivery
    title_hint = request.child_name or request.client_name or normalized_target_email
    title = request.title or f"Ensaio - {title_hint}"
    delivery = Delivery(
        id=uuid4(),
        partner_id=partner.id,
        title=title,
        client_name=request.client_name,
        description=request.description,
        event_date=request.event_date,
        status="draft",
        credit_status=credit_status,
        target_email=normalized_target_email,
        assets_payload={
            "files": [],
            "upload_started": False,
            # Mantemos a chave legada para compatibilidade com alguns fluxos/tests,
            # mas a fonte de verdade é Delivery.target_email.
            "client_email": normalized_target_email,
            "target_email": normalized_target_email,
            "child_name": request.child_name,
            "credit_reserved": credit_reserved,
            # Novo fluxo: sempre é importação direta via link (hard lock por e-mail)
            "direct_import": True,
        },
        target_account_id=existing_target_account_id,
    )
    db.add(delivery)

    if credit_reserved:
        db.add(
            PartnerLedger(
                id=uuid4(),
                partner_id=partner.id,
                amount=-1,
                type="reservation",
                description=f"reservation delivery={delivery.id} direct=true",
            )
        )
    
    await db.commit()
    await db.refresh(delivery)
    
    return DeliveryResponse(
        id=str(delivery.id),
        title=delivery.title,
        client_name=delivery.client_name,
        status=_normalize_partner_delivery_status(delivery.status),
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
    q: Optional[str] = None,
    voucher: Optional[str] = None,
    redeemed: Optional[str] = None,
    credit: Optional[str] = None,
    view: Optional[str] = None,
    created: Optional[str] = None,
    created_from: Optional[str] = None,
    created_to: Optional[str] = None,
    redeemed_period: Optional[str] = None,
    redeemed_from: Optional[str] = None,
    redeemed_to: Optional[str] = None,
    sort: str = "newest",
    include_archived: bool = False,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> DeliveryListResponse:
    """Lista entregas do parceiro."""
    partner = await get_partner_for_user(db, current_user)

    def _bad_request(detail: str) -> HTTPException:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    def _parse_date_or_datetime(value: str, *, end_of_day: bool) -> datetime:
        v = (value or "").strip()
        if not v:
            raise _bad_request("Data inválida")
        try:
            if "T" in v:
                dt = datetime.fromisoformat(v)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt

            d = date.fromisoformat(v)
            if end_of_day:
                return datetime(d.year, d.month, d.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
            return datetime(d.year, d.month, d.day, 0, 0, 0, 0, tzinfo=timezone.utc)
        except ValueError as exc:
            raise _bad_request(f"Data inválida: {v}") from exc

    def _period_bounds(period: str, frm: Optional[str], to: Optional[str]) -> tuple[Optional[datetime], Optional[datetime]]:
        p = (period or "").strip()
        if not p or p == "all":
            return None, None
        now = datetime.now(timezone.utc)
        if p in ("last_7", "last_30", "last_90"):
            days = 7 if p == "last_7" else 30 if p == "last_30" else 90
            return now - timedelta(days=days), now
        if p == "custom":
            start = _parse_date_or_datetime(frm, end_of_day=False) if (frm and frm.strip()) else None
            end = _parse_date_or_datetime(to, end_of_day=True) if (to and to.strip()) else None
            if start and end and start > end:
                raise _bad_request("Intervalo inválido: 'de' não pode ser maior que 'até'")
            return start, end
        raise _bad_request(f"Período inválido: {p}")

    allowed_voucher = {"with", "without"}
    allowed_redeemed = {"redeemed", "not_redeemed"}
    allowed_credit = {"reserved", "consumed", "refunded", "not_required", "unknown"}
    allowed_view = {"needs_action"}
    allowed_sort = {"newest", "oldest", "status", "client"}

    if voucher and voucher not in allowed_voucher:
        raise _bad_request(f"Filtro de voucher inválido: {voucher}")
    if redeemed and redeemed not in allowed_redeemed:
        raise _bad_request(f"Filtro de resgate inválido: {redeemed}")
    if credit and credit not in allowed_credit:
        raise _bad_request(f"Filtro de crédito inválido: {credit}")
    if view and view not in allowed_view:
        raise _bad_request(f"Filtro de visão inválido: {view}")
    if sort not in allowed_sort:
        raise _bad_request(f"Ordenação inválida: {sort}")

    safe_limit = max(1, min(int(limit or 20), 100))
    safe_offset = max(0, int(offset or 0))

    base_filters: list = [Delivery.partner_id == partner.id]

    # --- Busca (server-side, básica e consistente para total/paginação) ---
    if q and q.strip():
        tokens = [t for t in q.strip().lower().split() if t]
        for tok in tokens:
            like = f"%{tok}%"
            base_filters.append(
                or_(
                    func.lower(func.coalesce(Delivery.title, "")).like(like),
                    func.lower(func.coalesce(Delivery.client_name, "")).like(like),
                    func.lower(func.coalesce(Delivery.generated_voucher_code, "")).like(like),
                    func.lower(func.coalesce(Delivery.target_email, "")).like(like),
                    func.lower(func.coalesce(Delivery.beneficiary_email, "")).like(like),
                )
            )

    # --- Filtros avançados ---
    if voucher == "with":
        base_filters.append(Delivery.generated_voucher_code.is_not(None))
    elif voucher == "without":
        base_filters.append(Delivery.generated_voucher_code.is_(None))

    if redeemed == "redeemed":
        base_filters.append(Delivery.assets_transferred_at.is_not(None))
    elif redeemed == "not_redeemed":
        base_filters.append(Delivery.assets_transferred_at.is_(None))

    if credit == "unknown":
        base_filters.append(Delivery.credit_status.is_(None))
    elif credit:
        base_filters.append(Delivery.credit_status == credit)

    if view == "needs_action":
        base_filters.append(
            or_(
                Delivery.status.in_(["draft", "pending_upload", "failed"]),
                and_(Delivery.status == "ready", Delivery.generated_voucher_code.is_(None)),
            )
        )

    created_start, created_end = _period_bounds(created or "", created_from, created_to)
    if created_start:
        base_filters.append(Delivery.created_at >= created_start)
    if created_end:
        base_filters.append(Delivery.created_at <= created_end)

    redeemed_start, redeemed_end = _period_bounds(redeemed_period or "", redeemed_from, redeemed_to)
    if redeemed_start:
        base_filters.append(Delivery.assets_transferred_at >= redeemed_start)
    if redeemed_end:
        base_filters.append(Delivery.assets_transferred_at <= redeemed_end)

    # --- Agregações (coerentes com o subconjunto filtrado; independentes de status_filter/limit/offset) ---
    total_all = (
        (await db.execute(select(func.count(Delivery.id)).where(*base_filters))).scalar()
        or 0
    )
    archived_count = (
        (
            await db.execute(
                select(func.count(Delivery.id)).where(
                    *base_filters, Delivery.archived_at.is_not(None)
                )
            )
        ).scalar()
        or 0
    )

    by_status_rows = (
        await db.execute(
            select(Delivery.status, func.count(Delivery.id))
            .where(*base_filters, Delivery.archived_at.is_(None))
            .group_by(Delivery.status)
        )
    ).all()
    by_status: dict[str, int] = {}
    for raw_status, count in by_status_rows:
        normalized = _normalize_partner_delivery_status(raw_status)
        by_status[normalized] = by_status.get(normalized, 0) + int(count or 0)

    # --- Listagem (respeita include_archived + status_filter + paginação/ordenação) ---
    list_filters = list(base_filters)
    
    if status_filter == "archived":
        list_filters.append(Delivery.archived_at.is_not(None))
    elif not include_archived:
        list_filters.append(Delivery.archived_at.is_(None))

    if status_filter and status_filter != "archived":
        # Normaliza filtro do frontend para possíveis valores no banco.
        if status_filter == "delivered":
            list_filters.append(Delivery.status == "completed")
        elif status_filter == "processing":
            list_filters.append(Delivery.status.in_(["processing", "pending"]))
        else:
            list_filters.append(Delivery.status == status_filter)

    query = select(Delivery).where(*list_filters)

    if sort == "oldest":
        query = query.order_by(Delivery.created_at.asc())
    elif sort == "client":
        query = query.order_by(
            func.lower(func.coalesce(Delivery.client_name, "")).asc(),
            Delivery.created_at.desc(),
        )
    elif sort == "status":
        status_rank = case(
            (Delivery.status == "draft", 0),
            (Delivery.status == "pending_upload", 1),
            (Delivery.status.in_(["pending", "processing"]), 2),
            (Delivery.status == "failed", 3),
            (Delivery.status == "ready", 4),
            (Delivery.status == "completed", 5),
            else_=99,
        )
        query = query.order_by(status_rank.asc(), Delivery.created_at.desc())
    else:
        query = query.order_by(Delivery.created_at.desc())

    query = query.offset(safe_offset).limit(safe_limit)

    result = await db.execute(query)
    deliveries = result.scalars().all()
    
    # Conta total (respeitando filtros + include_archived + status_filter)
    total = (
        (await db.execute(select(func.count(Delivery.id)).where(*list_filters))).scalar()
        or 0
    )
    
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
    "/deliveries/{delivery_id}",
    response_model=DeliveryResponse,
    summary="Atualiza dados básicos de uma entrega",
    description=(
        "Atualiza campos não sensíveis de uma entrega (ex.: título, nome do cliente, descrição, data). "
        "Não permite alterar target_email nem forçar transições de status."
    ),
)
async def update_delivery(
    delivery_id: UUID,
    body: UpdateDeliveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> DeliveryResponse:
    await enforce_rate_limit(
        bucket="partner:deliveries:update:user", limit="60/minute", identity=current_user.id
    )
    partner = await get_partner_for_user(db, current_user)

    delivery = await db.scalar(
        select(Delivery)
        .where(and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id))
        .with_for_update()
    )
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada")

    # Status é controlado pelo sistema. Se vier, rejeitamos para evitar drift/abuso.
    if body.status is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O status da entrega não pode ser alterado manualmente.",
        )

    # Não permitir editar após resgate/import.
    if delivery.assets_transferred_at is not None or delivery.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entrega já resgatada/importada. Não é possível editar.",
        )

    if body.title is not None:
        delivery.title = body.title
    if body.client_name is not None:
        delivery.client_name = body.client_name
    if body.description is not None:
        delivery.description = body.description
    if body.event_date is not None:
        delivery.event_date = body.event_date

    await db.commit()
    await db.refresh(delivery)

    return DeliveryResponse(
        id=str(delivery.id),
        title=delivery.title,
        client_name=delivery.client_name,
        status=_normalize_partner_delivery_status(delivery.status),
        credit_status=delivery.credit_status,
        is_archived=delivery.archived_at is not None,
        archived_at=delivery.archived_at,
        assets_count=len(delivery.assets_payload.get("files", [])) if delivery.assets_payload else 0,
        voucher_code=delivery.generated_voucher_code,
        created_at=delivery.created_at,
        redeemed_at=delivery.assets_transferred_at,
        redeemed_by=delivery.beneficiary_email,
    )


@router.delete(
    "/deliveries/{delivery_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove uma entrega (somente rascunho)",
    description=(
        "Remove uma entrega apenas quando ainda está em rascunho e sem uploads/voucher. "
        "Se houve reserva de crédito na criação, estorna automaticamente."
    ),
)
async def delete_delivery(
    delivery_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
    _: None = Depends(require_csrf_token),
) -> Response:
    await enforce_rate_limit(
        bucket="partner:deliveries:delete:user", limit="30/minute", identity=current_user.id
    )
    partner = await get_partner_for_user(db, current_user)

    delivery = await db.scalar(
        select(Delivery)
        .where(and_(Delivery.id == delivery_id, Delivery.partner_id == partner.id))
        .with_for_update()
    )
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada")

    files = (delivery.assets_payload or {}).get("files") or []
    if delivery.status != "draft" or delivery.generated_voucher_code is not None or files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Só é possível remover entregas em rascunho e sem uploads/voucher.",
        )

    if delivery.assets_transferred_at is not None or delivery.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entrega já resgatada/importada. Não é possível remover.",
        )

    # Estorno de crédito se ainda estava reservado.
    if delivery.credit_status == "reserved":
        locked_partner = await db.scalar(
            select(Partner).where(Partner.id == partner.id).with_for_update()
        )
        if locked_partner is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parceiro não encontrado",
            )
        locked_partner.voucher_balance += 1
        db.add(
            PartnerLedger(
                id=uuid4(),
                partner_id=partner.id,
                amount=+1,
                type="refund",
                description=f"refund delete delivery={delivery.id}",
            )
        )

    await db.delete(delivery)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    delivery_id: UUID,
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
    
    # Novo fluxo: Entrega Direta (sem voucher) quando marcado como direct_import.
    # O resgate/import é feito autenticado e travado por e-mail (Delivery.target_email).
    direct_import_flag = bool((assets_payload or {}).get("direct_import"))
    if direct_import_flag:
        delivery.generated_voucher_code = None
        delivery.status = "ready"
        delivery.beneficiary_name = request.beneficiary_name
        await db.commit()

        import_url = f"{settings.frontend_url}/jornada/importar-entrega/{delivery.id}"
        return VoucherCardResponse(
            mode="direct_import",
            voucher_code=None,
            redeem_url=None,
            qr_data=None,
            import_url=import_url,
            studio_name=partner.company_name or partner.name,
            studio_logo_url=partner.logo_url,
            beneficiary_name=request.beneficiary_name,
            message=request.message
            or f"O {partner.company_name or partner.name} preparou suas fotos! Abra o link e importe no seu Baby Book.",
            assets_count=len(assets_payload["files"]),
            expires_at=None,
        )

    # Fluxo padrão: gera código do voucher
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
    redeem_url = f"{settings.frontend_url}/resgatar?code={voucher_code}"
    qr_data = redeem_url

    return VoucherCardResponse(
        mode="voucher",
        voucher_code=voucher_code,
        redeem_url=redeem_url,
        qr_data=qr_data,
        import_url=None,
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
                Delivery.status == "completed",
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
