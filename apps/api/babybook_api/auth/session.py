from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from fastapi import Cookie, Depends, Header
from starlette import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.db.models import Session as SessionModel
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError


@dataclass(frozen=True)
class UserSession:
    id: str
    account_id: str
    email: str
    name: str
    locale: str
    role: str


async def _get_session_token(
    cookie_token: str | None = Cookie(default=None, alias="__Host-session"),
    header_token: str | None = Header(default=None, alias="X-BB-Session"),
) -> str | None:
    return cookie_token or header_token


async def _fetch_session(db: AsyncSession, token: str | None) -> SessionModel:
    if not token:
        raise AppError(status_code=401, code="auth.session.invalid", message="Sessao nao autenticada.")

    stmt = select(SessionModel).where(SessionModel.token == token).options(selectinload(SessionModel.user))
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if (
        not session
        or session.revoked_at is not None
        or session.expires_at < datetime.utcnow()
    ):
        raise AppError(status_code=401, code="auth.session.invalid", message="Sessao expirada.")

    return session


async def get_current_session(
    token: str | None = Depends(_get_session_token),
    db: AsyncSession = Depends(get_db_session),
) -> SessionModel:
    return await _fetch_session(db, token)


async def get_current_user(
    session: SessionModel = Depends(get_current_session),
) -> UserSession:
    user = session.user
    if user is None:
        raise AppError(status_code=401, code="auth.session.invalid", message="Usuario nao encontrado.")

    return UserSession(
        id=str(user.id),
        account_id=str(user.account_id),
        email=user.email,
        name=user.name,
        locale=user.locale,
        role=user.role,
    )


async def require_csrf_token(
    session: SessionModel = Depends(get_current_session),
    csrf_token: str | None = Header(default=None, alias="X-CSRF-Token"),
) -> None:
    """Exige CSRF token para requisições mutáveis (cookie-based session).

    O token precisa ser enviado fora do cookie (header), e precisa bater com o
    token armazenado na sessão.
    """
    if not csrf_token:
        raise AppError(
            status_code=status.HTTP_403_FORBIDDEN,
            code="auth.csrf.missing",
            message="Token CSRF obrigatorio.",
        )
    if csrf_token != session.csrf_token:
        raise AppError(
            status_code=status.HTTP_403_FORBIDDEN,
            code="auth.csrf.invalid",
            message="Token CSRF invalido.",
        )
