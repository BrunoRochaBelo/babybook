from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import Session, User
from babybook_api.errors import AppError
from babybook_api.security import (
    hash_password,
    new_session_token,
    validate_csrf_token,
    verify_password,
)
from babybook_api.settings import settings

SESSION_COOKIE_NAME = "__Host-session"


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise AppError(status_code=401, code="auth.credentials.invalid", message="Credenciais invalidas.")
    return user


async def create_session(
    db: AsyncSession,
    user: User,
    csrf_token: str,
    *,
    user_agent: str | None,
    client_ip: str | None,
) -> Session:
    validate_csrf_token(csrf_token)

    token = new_session_token()
    expires_at = datetime.utcnow() + timedelta(hours=settings.session_ttl_hours)

    session = Session(
        account_id=user.account_id,
        user_id=user.id,
        token=token,
        csrf_token=csrf_token,
        expires_at=expires_at,
        last_ip=client_ip,
        user_agent=user_agent,
    )
    db.add(session)
    await db.flush()
    return session


async def revoke_session(db: AsyncSession, session: Session) -> None:
    session.revoked_at = datetime.utcnow()
    await db.flush()


def apply_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
        max_age=settings.session_ttl_hours * 3600,
    )


async def bootstrap_dev_user(db: AsyncSession, email: str, password: str, account_name: str) -> User:
    """
    Helper para ambientes locais: cria uma conta + usuário se não existir.
    """
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if user:
        return user

    from babybook_api.db.models import Account

    account = Account(name=account_name, slug=account_name.lower().replace(" ", "-"))
    db.add(account)
    await db.flush()

    user = User(
        account_id=account.id,
        email=email.lower(),
        password_hash=hash_password(password),
        name=account_name,
        locale="pt-BR",
        role="owner",
    )
    db.add(user)
    await db.flush()
    return user

