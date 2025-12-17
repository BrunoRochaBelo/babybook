from __future__ import annotations

import hashlib
from dataclasses import replace

import uuid

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Asset, Child, Moment
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.me import MeResponse, MeUpdateRequest, UsageResponse
from babybook_api.settings import settings

router = APIRouter()


def _compute_etag(user: UserSession) -> str:
    digest = hashlib.sha256(f"{user.id}:{user.email}:{user.locale}".encode("utf-8")).hexdigest()
    return f'W/"{digest[:16]}"'


def _serialize_user(user: UserSession) -> MeResponse:
    return MeResponse(id=user.id, email=user.email, name=user.name, locale=user.locale)


@router.get("/", response_model=MeResponse, summary="Retorna dados do usuario autenticado")
async def get_me(response: Response, current_user: UserSession = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)) -> MeResponse:
    response.headers["ETag"] = _compute_etag(current_user)
    # compute has_purchased and onboarding_completed by inspecting account
    from babybook_api.deps import get_db_session
    from sqlalchemy.ext.asyncio import AsyncSession

    async def _get_flags(db: AsyncSession) -> tuple[bool, bool]:
        account_id = uuid.UUID(current_user.account_id)
        stmt_account = select(Account).where(Account.id == account_id)
        account = (await db.execute(stmt_account)).scalar_one()
        has_purchased = (
            (account.plan and account.plan != "plano_base")
            or bool(account.unlimited_social)
            or bool(account.unlimited_creative)
            or bool(account.unlimited_tracking)
        )
        stmt_children = select(func.count()).select_from(Child).where(
            Child.account_id == account_id,
            Child.deleted_at.is_(None),
        )
        # Simple onboarding heuristic: hasChildren or hasMoments
        children_count = (await db.execute(stmt_children)).scalar_one()
        onboarding_completed = children_count > 0
        return has_purchased, onboarding_completed

    has_purchased, onboarding_completed = await _get_flags(db)
    result = _serialize_user(current_user)
    result.has_purchased = has_purchased
    result.onboarding_completed = onboarding_completed
    return result


@router.patch(
    "/",
    response_model=MeResponse,
    summary="Atualiza preferencias basicas do usuario",
)
async def patch_me(
    payload: MeUpdateRequest,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    current_user: UserSession = Depends(get_current_user),
) -> MeResponse:
    current_etag = _compute_etag(current_user)
    if if_match is None:
        raise AppError(
            status_code=412,
            code="me.precondition.required",
            message="Cabecalho If-Match obrigatorio.",
        )
    if if_match != current_etag:
        raise AppError(
            status_code=412,
            code="me.precondition.failed",
            message="Versao desatualizada. Recarregue os dados.",
        )

    updated_user = replace(
        current_user,
        name=payload.name or current_user.name,
        locale=payload.locale or current_user.locale,
    )
    new_etag = _compute_etag(updated_user)
    response.headers["ETag"] = new_etag
    return _serialize_user(updated_user)


@router.get(
    "/usage",
    response_model=UsageResponse,
    summary="Uso atual e quotas efetivas",
)
async def usage_summary(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    child_id: uuid.UUID = Query(
        ..., 
        description="ID do Child (Livro) para retornar quota/uso de storage de forma child-centric.",
    ),
) -> UsageResponse:
    account_id = uuid.UUID(current_user.account_id)

    stmt_child = select(Child).where(
        Child.id == child_id,
        Child.account_id == account_id,
        Child.deleted_at.is_(None),
    )
    child = (await db.execute(stmt_child)).scalar_one_or_none()
    if child is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")

    stmt_moments = select(func.count()).select_from(Moment).where(
        Moment.account_id == account_id,
        Moment.child_id == child.id,
        Moment.deleted_at.is_(None),
    )
    moments_used = (await db.execute(stmt_moments)).scalar_one()

    stmt_used = select(func.coalesce(func.sum(Asset.size_bytes), 0)).where(
        Asset.account_id == account_id,
        Asset.child_id == child.id,
        Asset.status != "failed",
    )
    bytes_used = (await db.execute(stmt_used)).scalar_one()

    return UsageResponse(
        bytes_used=bytes_used,
        bytes_quota=child.storage_quota_bytes,
        moments_used=moments_used,
        moments_quota=settings.quota_moments,
    )
