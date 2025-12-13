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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.deps import get_db
from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Partner, Delivery, Voucher, DeliveryAsset, User
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
    GenerateVoucherCardRequest,
    VoucherCardResponse,
    UploadInitRequest,
    UploadInitResponse,
    UploadCompleteRequest,
    CheckAccessResponse,
    ChildInfo,
)
from babybook_api.storage import (
    StoragePaths,
    secure_filename,
    get_partner_storage,
    PartnerStorageService,
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
    
    result = await db.execute(
        select(Partner).where(Partner.user_id == user.user_id)
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

CREDIT_PACKAGES: list[CreditPackage] = [
    CreditPackage(
        id="pack_5",
        name="Pacote Inicial",
        voucher_count=5,
        price_cents=60000,  # R$ 600
        unit_price_cents=12000,  # R$ 120/unid
        savings_percent=0,
    ),
    CreditPackage(
        id="pack_10",
        name="Pacote Profissional",
        voucher_count=10,
        price_cents=100000,  # R$ 1.000
        unit_price_cents=10000,  # R$ 100/unid
        savings_percent=17,
        is_popular=True,
    ),
    CreditPackage(
        id="pack_25",
        name="Pacote Estúdio",
        voucher_count=25,
        price_cents=200000,  # R$ 2.000
        unit_price_cents=8000,  # R$ 80/unid
        savings_percent=33,
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
    db: AsyncSession = Depends(get_db),
) -> PartnerOnboardingResponse:
    """Cadastro de novo parceiro (fotógrafo)."""
    
    # Verifica se email já existe
    existing_user = await db.execute(
        select(User).where(User.email == request.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado"
        )
    
    existing_partner = await db.execute(
        select(Partner).where(Partner.email == request.email)
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
        email=request.email,
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
        email=request.email,
        slug=generate_slug(request.studio_name or request.name),
        company_name=request.studio_name,
        phone=request.phone,
        status="pending_approval",
        voucher_balance=0,
    )
    db.add(partner)
    
    await db.commit()
    
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
) -> PartnerProfileResponse:
    """Atualiza o perfil do parceiro logado."""
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
    # Garante que é um parceiro válido
    await get_partner_for_user(db, current_user)
    
    # Busca usuário pelo email
    result = await db.execute(
        select(User).where(User.email == email.lower())
    )
    user = result.scalar_one_or_none()
    
    if user:
        # Usuário existe - tem acesso (pode ser B2C ou via outro fotógrafo)
        # TODO: Buscar filhos/contas do usuário quando o modelo permitir
        return CheckAccessResponse(
            has_access=True,
            email=email.lower(),
            client_name=user.name,
            children=[],  # TODO: Popular com filhos reais do usuário
            message=f"Cliente já possui acesso ao Baby Book. Esta entrega não consumirá crédito.",
        )
    else:
        # Usuário não existe - novo cliente
        return CheckAccessResponse(
            has_access=False,
            email=email.lower(),
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
) -> PurchaseCreditsResponse:
    """Inicia compra de pacote de créditos."""
    partner = await get_partner_for_user(db, current_user)
    
    # Busca pacote
    package = next((p for p in CREDIT_PACKAGES if p.id == request.package_id), None)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pacote não encontrado"
        )
    
    # TODO: Integrar com Stripe/Pagar.me
    # Por enquanto, simula checkout
    checkout_id = f"chk_{uuid4().hex[:16]}"
    
    # Em produção: criar sessão de checkout no gateway
    # e retornar a URL do gateway
    checkout_url = f"/partner/checkout/{checkout_id}?package={package.id}"
    
    return PurchaseCreditsResponse(
        checkout_id=checkout_id,
        checkout_url=checkout_url,
        package=package,
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
) -> dict:
    """Confirma compra e adiciona créditos (sandbox/dev)."""
    partner = await get_partner_for_user(db, current_user)
    
    package = next((p for p in CREDIT_PACKAGES if p.id == package_id), None)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pacote não encontrado"
        )
    
    # Adiciona créditos
    partner.voucher_balance += package.voucher_count
    await db.commit()
    
    return {
        "success": True,
        "credits_added": package.voucher_count,
        "new_balance": partner.voucher_balance,
    }


# =============================================================================
# Deliveries (Entregas)
# =============================================================================

@router.post(
    "/deliveries",
    response_model=DeliveryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria nova entrega",
    description="""
    Cria uma nova entrega para um cliente.
    
    **Regras de crédito:**
    - Se cliente_email não existir no sistema: consome 1 crédito
    - Se cliente_email já tiver conta: NÃO consome crédito (grátis)
    
    Retorna delivery_id para fazer upload dos assets.
    """,
)
async def create_delivery(
    request: CreateDeliveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> DeliveryResponse:
    """Cria nova entrega com crédito condicional."""
    partner = await get_partner_for_user(db, current_user)
    
    # Verifica se cliente já tem acesso (crédito condicional)
    client_has_access = False
    if request.client_email:
        result = await db.execute(
            select(User).where(User.email == request.client_email.lower())
        )
        existing_user = result.scalar_one_or_none()
        client_has_access = existing_user is not None
    
    # Verifica saldo apenas se cliente é novo (não tem acesso)
    if not client_has_access and partner.voucher_balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Saldo insuficiente. Compre mais créditos."
        )
    
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
        assets_payload={
            "files": [],
            "upload_started": False,
            "client_email": request.client_email,
            "child_name": request.child_name,
            "credit_consumed": not client_has_access,  # Indica se crédito foi usado
        },
    )
    db.add(delivery)
    
    # Desconta crédito apenas se cliente é novo
    if not client_has_access:
        partner.voucher_balance -= 1
    
    await db.commit()
    await db.refresh(delivery)
    
    return DeliveryResponse(
        id=str(delivery.id),
        title=delivery.title,
        client_name=delivery.client_name,
        status=delivery.status,
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
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> DeliveryListResponse:
    """Lista entregas do parceiro."""
    partner = await get_partner_for_user(db, current_user)
    
    query = select(Delivery).where(Delivery.partner_id == partner.id)
    
    if status_filter:
        query = query.where(Delivery.status == status_filter)
    
    query = query.order_by(Delivery.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    deliveries = result.scalars().all()
    
    # Conta total
    count_query = select(func.count(Delivery.id)).where(Delivery.partner_id == partner.id)
    if status_filter:
        count_query = count_query.where(Delivery.status == status_filter)
    total = (await db.execute(count_query)).scalar() or 0
    
    return DeliveryListResponse(
        deliveries=[
            DeliveryResponse(
                id=str(d.id),
                title=d.title,
                client_name=d.client_name,
                status=d.status,
                assets_count=len(d.assets_payload.get("files", [])) if d.assets_payload else 0,
                voucher_code=d.generated_voucher_code,
                created_at=d.created_at,
                redeemed_at=d.assets_transferred_at,
                redeemed_by=d.beneficiary_email,
            )
            for d in deliveries
        ],
        total=total,
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
        status=delivery.status,
        assets_count=len(files),
        assets=files,
        voucher_code=delivery.generated_voucher_code,
        created_at=delivery.created_at,
        redeemed_at=delivery.assets_transferred_at,
        redeemed_by=delivery.beneficiary_email,
    )


# =============================================================================
# Upload (Client-Side Direct Upload)
# =============================================================================

@router.post(
    "/deliveries/{delivery_id}/upload/init",
    response_model=UploadInitResponse,
    summary="Inicia upload de arquivo",
    description="""
    Retorna URL presigned para upload direto ao B2/R2.
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
) -> UploadInitResponse:
    """Inicia upload de arquivo para entrega."""
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
    
    # Usa PartnerStorageService para preparar upload
    # Arquivos vão para tmp/uploads/ primeiro (lifecycle de 1 dia)
    upload_info = await storage.init_partner_upload(
        partner_id=str(partner.id),
        delivery_id=delivery_id,
        filename=request.filename,
        content_type=request.content_type or "application/octet-stream",
        size_bytes=request.size_bytes or 0,
    )
    
    # Atualiza status
    if delivery.status == "draft":
        delivery.status = "pending_upload"
        delivery.assets_payload = {"files": [], "upload_started": True}
    
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
) -> dict:
    """Confirma que o upload foi concluído e move para pasta permanente."""
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
