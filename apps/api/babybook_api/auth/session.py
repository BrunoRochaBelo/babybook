from __future__ import annotations

from dataclasses import dataclass

from fastapi import Cookie, Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette import status

from babybook_api.auth.constants import SESSION_COOKIE_NAME
from babybook_api.db.models import Session as SessionModel
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.settings import settings
from babybook_api.time import is_expired


@dataclass(frozen=True)
class UserSession:
    id: str
    account_id: str
    email: str
    name: str
    locale: str
    role: str


async def _get_session_token(
    cookie_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    header_token: str | None = Header(default=None, alias="X-BB-Session"),
) -> str | None:
    if cookie_token:
        return cookie_token

    # Fallback de sessão via header: útil apenas em local/E2E.
    if header_token and (settings.app_env == "local" or settings.allow_header_session_auth):
        return header_token

    return None


async def _fetch_session(db: AsyncSession, token: str | None) -> SessionModel:
    if not token:
        raise AppError(status_code=401, code="auth.session.invalid", message="Sessao nao autenticada.")

    stmt = select(SessionModel).where(SessionModel.token == token).options(selectinload(SessionModel.user))
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if (
        not session
        or session.revoked_at is not None
        or is_expired(session.expires_at)
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


async def get_optional_user(
    token: str | None = Depends(_get_session_token),
    db: AsyncSession = Depends(get_db_session),
) -> UserSession | None:
    """Retorna o usuário atual se autenticado; caso contrário, None.

    Útil para endpoints de onboarding (ex.: resgate de voucher) que podem:
    - funcionar com sessão existente, OU
    - criar conta/sessão no próprio fluxo.
    """
    if not token:
        return None
    try:
        session = await _fetch_session(db, token)
    except AppError as exc:
        # Para o caminho opcional, ausência/invalidade de sessão vira None.
        if exc.status_code == 401 and exc.code == "auth.session.invalid":
            return None
        raise

    user = session.user
    if user is None:
        return None

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
    validate_csrf_token_for_session(session=session, csrf_token=csrf_token)


def validate_csrf_token_for_session(*, session: SessionModel, csrf_token: str | None) -> None:
    """Valida CSRF token em modo cookie-session.

    Alguns endpoints precisam rodar checagens de autorização (ex.: ownership)
    antes de exigir CSRF, para evitar bloquear mensagens de erro específicas.
    Essa função permite aplicar o mesmo enforcement de forma manual.
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
