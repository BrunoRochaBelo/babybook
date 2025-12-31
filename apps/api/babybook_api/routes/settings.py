"""
Routes para Configurações de Conta B2C.

Endpoints para gerenciamento de família, assinatura e dados.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user, require_csrf_token
from babybook_api.db.models import Account, Asset, Child, Moment, User
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.rate_limit import enforce_rate_limit

router = APIRouter()


# =============================================================================
# Schemas
# =============================================================================


class FamilyMemberResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str = "active"


class FamilyMemberInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="viewer", pattern="^(guardian|viewer)$")


class FamilyListResponse(BaseModel):
    members: list[FamilyMemberResponse] = Field(default_factory=list)
    total: int = 0


class SubscriptionResponse(BaseModel):
    plan_name: str
    plan_display_name: str
    price_cents: int = 0
    currency: str = "BRL"
    renewal_date: datetime | None = None
    features: list[str] = Field(default_factory=list)
    storage_bytes_used: int = 0
    storage_bytes_limit: int = 0  # 0 = unlimited
    is_unlimited: bool = False


class StorageStatsResponse(BaseModel):
    bytes_used: int = 0
    bytes_quota: int = 0
    is_unlimited: bool = False
    photos_count: int = 0
    videos_count: int = 0
    audios_count: int = 0
    last_backup_at: datetime | None = None


class DataExportRequest(BaseModel):
    format: str = Field(default="zip", pattern="^(zip|json)$")


class DataExportResponse(BaseModel):
    request_id: str
    status: str = "queued"
    message: str = "Sua solicitação foi recebida. Você receberá um email quando estiver pronta."


class DeleteAccountRequest(BaseModel):
    confirmation: str = Field(..., description="Deve ser exatamente 'EXCLUIR MINHA CONTA'")
    password: str = Field(..., min_length=1)


# =============================================================================
# Family Management
# =============================================================================


@router.get("/family", response_model=FamilyListResponse, summary="Lista membros da família")
async def list_family_members(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> FamilyListResponse:
    """Lista todos os membros da família (usuários da conta)."""
    account_id = uuid.UUID(current_user.account_id)

    stmt = select(User).where(User.account_id == account_id)
    result = await db.execute(stmt)
    users = result.scalars().all()

    members = [
        FamilyMemberResponse(
            id=str(u.id),
            name=u.name,
            email=u.email,
            role=u.role,
            status="active" if u.locked_until is None else "locked",
        )
        for u in users
    ]

    return FamilyListResponse(members=members, total=len(members))


@router.post(
    "/family/invite",
    response_model=FamilyMemberResponse,
    summary="Convida membro para a família",
)
async def invite_family_member(
    body: FamilyMemberInviteRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> FamilyMemberResponse:
    """Convida um novo membro para a família por email."""
    await enforce_rate_limit(bucket="family:invite:user", limit="5/hour", identity=current_user.id)
    
    # Verifica se o usuário atual é owner
    user_id = uuid.UUID(current_user.id)
    stmt_user = select(User).where(User.id == user_id)
    current_db_user = (await db.execute(stmt_user)).scalar_one_or_none()
    
    if current_db_user is None or current_db_user.role != "owner":
        raise AppError(
            status_code=403,
            code="family.not_owner",
            message="Apenas o dono da conta pode convidar membros.",
        )

    # Verifica se o email já existe
    stmt_existing = select(User).where(User.email == body.email.lower())
    existing = (await db.execute(stmt_existing)).scalar_one_or_none()
    
    if existing is not None:
        raise AppError(
            status_code=409,
            code="family.email_exists",
            message="Este email já está em uso.",
        )

    # TODO: Em produção, criar um convite pendente e enviar email.
    # Por enquanto, retornamos o membro como "pendente".
    return FamilyMemberResponse(
        id=str(uuid.uuid4()),
        name=body.email.split("@")[0],
        email=body.email,
        role=body.role,
        status="pending",
    )


@router.delete("/family/{member_id}", summary="Remove membro da família")
async def remove_family_member(
    member_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> dict:
    """Remove um membro da família (não pode remover o owner)."""
    await enforce_rate_limit(bucket="family:remove:user", limit="10/hour", identity=current_user.id)
    
    account_id = uuid.UUID(current_user.account_id)
    user_id = uuid.UUID(current_user.id)
    
    # Verifica se o usuário atual é owner
    stmt_user = select(User).where(User.id == user_id)
    current_db_user = (await db.execute(stmt_user)).scalar_one_or_none()
    
    if current_db_user is None or current_db_user.role != "owner":
        raise AppError(
            status_code=403,
            code="family.not_owner",
            message="Apenas o dono da conta pode remover membros.",
        )

    # Busca o membro a remover
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError as exc:
        raise AppError(status_code=400, code="family.invalid_id", message="ID inválido.") from exc

    stmt_member = select(User).where(User.id == member_uuid, User.account_id == account_id)
    member = (await db.execute(stmt_member)).scalar_one_or_none()

    if member is None:
        raise AppError(status_code=404, code="family.member_not_found", message="Membro não encontrado.")

    if member.role == "owner":
        raise AppError(status_code=400, code="family.cannot_remove_owner", message="Não é possível remover o dono da conta.")

    await db.delete(member)
    await db.commit()

    return {"success": True, "message": "Membro removido com sucesso."}


# =============================================================================
# Subscription
# =============================================================================


PLAN_DETAILS = {
    "plano_base": {
        "display_name": "Plano Gratuito",
        "price_cents": 0,
        "features": ["1 álbum", "2GB de armazenamento", "60 momentos"],
    },
    "plano_familia": {
        "display_name": "Plano Família",
        "price_cents": 2990,
        "features": [
            "Armazenamento ilimitado de fotos e vídeos",
            "Até 5 membros da família",
            "Backup automático em nuvem",
            "Cápsula do tempo programada",
            "Exportação em alta resolução",
            "Suporte prioritário",
        ],
    },
    "plano_premium": {
        "display_name": "Plano Premium",
        "price_cents": 4990,
        "features": [
            "Tudo do Plano Família",
            "Álbuns ilimitados",
            "IA para organização de fotos",
            "Exportação em PDF de alta qualidade",
        ],
    },
}


@router.get("/subscription", response_model=SubscriptionResponse, summary="Detalhes da assinatura")
async def get_subscription(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SubscriptionResponse:
    """Retorna detalhes da assinatura atual."""
    account_id = uuid.UUID(current_user.account_id)

    stmt = select(Account).where(Account.id == account_id)
    account = (await db.execute(stmt)).scalar_one_or_none()

    if account is None:
        raise AppError(status_code=404, code="account.not_found", message="Conta não encontrada.")

    plan_key = account.plan or "plano_base"
    plan_info = PLAN_DETAILS.get(plan_key, PLAN_DETAILS["plano_base"])

    is_unlimited = (
        account.unlimited_social or account.unlimited_creative or account.unlimited_tracking
    )

    return SubscriptionResponse(
        plan_name=plan_key,
        plan_display_name=plan_info["display_name"],
        price_cents=plan_info["price_cents"],
        currency="BRL",
        renewal_date=None,  # TODO: Obter de billing_events quando implementado
        features=plan_info["features"],
        storage_bytes_used=account.storage_bytes_used,
        storage_bytes_limit=account.plan_storage_bytes if not is_unlimited else 0,
        is_unlimited=is_unlimited,
    )


# =============================================================================
# Storage Stats
# =============================================================================


@router.get("/storage", response_model=StorageStatsResponse, summary="Estatísticas de armazenamento")
async def get_storage_stats(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> StorageStatsResponse:
    """Retorna estatísticas detalhadas de armazenamento."""
    account_id = uuid.UUID(current_user.account_id)

    # Busca account
    stmt_account = select(Account).where(Account.id == account_id)
    account = (await db.execute(stmt_account)).scalar_one_or_none()

    if account is None:
        raise AppError(status_code=404, code="account.not_found", message="Conta não encontrada.")

    # Conta por tipo de asset
    stmt_photos = select(func.count()).select_from(Asset).where(
        Asset.account_id == account_id,
        Asset.kind == "photo",
        Asset.status != "failed",
    )
    photos_count = (await db.execute(stmt_photos)).scalar_one()

    stmt_videos = select(func.count()).select_from(Asset).where(
        Asset.account_id == account_id,
        Asset.kind == "video",
        Asset.status != "failed",
    )
    videos_count = (await db.execute(stmt_videos)).scalar_one()

    stmt_audios = select(func.count()).select_from(Asset).where(
        Asset.account_id == account_id,
        Asset.kind == "audio",
        Asset.status != "failed",
    )
    audios_count = (await db.execute(stmt_audios)).scalar_one()

    is_unlimited = (
        account.unlimited_social or account.unlimited_creative or account.unlimited_tracking
    )

    return StorageStatsResponse(
        bytes_used=account.storage_bytes_used,
        bytes_quota=account.plan_storage_bytes if not is_unlimited else 0,
        is_unlimited=is_unlimited,
        photos_count=photos_count,
        videos_count=videos_count,
        audios_count=audios_count,
        last_backup_at=account.updated_at,  # Placeholder
    )


# =============================================================================
# Data Export
# =============================================================================


@router.post("/data/export", response_model=DataExportResponse, summary="Solicita exportação de dados")
async def request_data_export(
    body: DataExportRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> DataExportResponse:
    """Solicita exportação de todos os dados do usuário (GDPR/LGPD)."""
    await enforce_rate_limit(bucket="data:export:user", limit="1/day", identity=current_user.id)

    # TODO: Criar job em background para gerar o arquivo de exportação
    # Por enquanto, apenas registra a solicitação
    request_id = str(uuid.uuid4())

    return DataExportResponse(
        request_id=request_id,
        status="queued",
        message="Sua solicitação foi recebida. Você receberá um email quando o download estiver pronto.",
    )


# =============================================================================
# Delete Account
# =============================================================================


@router.post("/data/delete", summary="Solicita exclusão da conta")
async def request_account_deletion(
    body: DeleteAccountRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> dict:
    """Solicita exclusão permanente da conta e todos os dados."""
    await enforce_rate_limit(bucket="data:delete:user", limit="1/day", identity=current_user.id)

    if body.confirmation != "EXCLUIR MINHA CONTA":
        raise AppError(
            status_code=400,
            code="delete.confirmation_invalid",
            message="Confirmação inválida. Digite exatamente 'EXCLUIR MINHA CONTA'.",
        )

    # Verifica senha
    from babybook_api.auth.password import verify_password

    user_id = uuid.UUID(current_user.id)
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user is None:
        raise AppError(status_code=404, code="user.not_found", message="Usuário não encontrado.")

    if not verify_password(body.password, user.password_hash):
        raise AppError(status_code=401, code="delete.password_invalid", message="Senha incorreta.")

    # TODO: Criar job em background para excluir dados
    # TODO: Marcar conta para exclusão em 30 dias (retention period)
    # Por enquanto, apenas retorna sucesso
    return {
        "success": True,
        "message": "Sua conta será excluída em 30 dias. Você pode cancelar a qualquer momento.",
    }
