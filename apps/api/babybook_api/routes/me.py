from __future__ import annotations

import hashlib
from dataclasses import replace

import uuid

from fastapi import APIRouter, Depends, Header, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Moment
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
async def get_me(response: Response, current_user: UserSession = Depends(get_current_user)) -> MeResponse:
    response.headers["ETag"] = _compute_etag(current_user)
    return _serialize_user(current_user)


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
) -> UsageResponse:
    account_id = uuid.UUID(current_user.account_id)
    stmt_moments = select(func.count()).select_from(Moment).where(
        Moment.account_id == account_id,
        Moment.deleted_at.is_(None),
    )
    moments_used = (await db.execute(stmt_moments)).scalar_one()

    stmt_account = select(Account).where(Account.id == account_id)
    account = (await db.execute(stmt_account)).scalar_one()

    return UsageResponse(
        bytes_used=account.storage_bytes_used,
        bytes_quota=account.plan_storage_bytes or settings.quota_storage_bytes,
        moments_used=moments_used,
        moments_quota=settings.quota_moments,
    )
