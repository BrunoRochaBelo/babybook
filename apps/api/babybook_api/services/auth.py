from __future__ import annotations

from datetime import datetime, timedelta

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
    remember_me: bool = False,
) -> Session:
    validate_csrf_token(csrf_token)

    token = new_session_token()
    # Se remember_me, sessão dura 30 dias; senão, usa o padrão
    if remember_me:
        expires_at = datetime.utcnow() + timedelta(days=30)
    else:
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


def apply_session_cookie(response: Response, token: str, remember_me: bool = False) -> None:
    # Se remember_me, cookie dura 30 dias; senão, usa o padrão
    max_age = 30 * 24 * 3600 if remember_me else settings.session_ttl_hours * 3600
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
        max_age=max_age,
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


async def create_user(db: AsyncSession, email: str, password: str, name: str) -> User:
    """
    Cria usuário com conta nova. Retorna o usuário. Levanta AppError se o email já existir.
    """
    result = await db.execute(select(User).where(User.email == email.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        from babybook_api.errors import AppError

        raise AppError(status_code=409, code="auth.user.exists", message="Usuario ja cadastrado.")

    from babybook_api.db.models import Account

    account = Account(name=name or email.split("@")[0], slug=(name or email.split("@")[0]).lower().replace(" ", "-"))
    db.add(account)
    await db.flush()

    user = User(
        account_id=account.id,
        email=email.lower(),
        password_hash=hash_password(password),
        name=name or (email.split("@")[0]),
        locale="pt-BR",
        role="owner",
    )
    db.add(user)
    await db.flush()
    return user


async def get_or_create_user_by_email(db: AsyncSession, email: str, name: str | None = None) -> User:
    """
    Return existing user by email or create a new account/user.
    """
    result = await db.execute(select(User).where(User.email == email.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    from babybook_api.db.models import Account

    account = Account(name=name or email.split("@")[0], slug=(name or email.split("@")[0]).lower().replace(" ", "-"))
    db.add(account)
    await db.flush()
    user = User(
        account_id=account.id,
        email=email.lower(),
        password_hash=hash_password(""),
        name=name or (email.split("@")[0]),
        locale="pt-BR",
        role="owner",
    )
    db.add(user)
    await db.flush()
    return user


async def bootstrap_dev_partner(
    db: AsyncSession,
    email: str = "pro@babybook.dev",
    password: str = "pro123",
    name: str = "Maria Fotógrafa",
    studio_name: str = "Estúdio Demo",
) -> None:
    """
    Helper para ambientes locais: cria um parceiro/fotógrafo de teste se não existir.
    
    Credenciais padrão:
    - Email: pro@babybook.dev
    - Senha: pro123
    - Créditos: 5
    """
    from uuid import uuid4

    from babybook_api.db.models import Account, Partner
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    
    if user is None:
        # Create account for photographer
        account = Account(
            name=studio_name,
            slug=studio_name.lower().replace(" ", "-").replace("ú", "u"),
        )
        db.add(account)
        await db.flush()
        
        # Create user with photographer role
        user = User(
            account_id=account.id,
            email=email.lower(),
            password_hash=hash_password(password),
            name=name,
            locale="pt-BR",
            role="photographer",
        )
        db.add(user)
        await db.flush()
    else:
        # Ensure role is photographer
        if user.role != "photographer":
            user.role = "photographer"
    
    # Check if partner exists
    result = await db.execute(select(Partner).where(Partner.user_id == user.id))
    partner = result.scalar_one_or_none()
    
    if partner is None:
        partner = Partner(
            id=uuid4(),
            user_id=user.id,
            name=name,
            email=email.lower(),
            slug=studio_name.lower().replace(" ", "-").replace("ú", "u"),
            company_name=studio_name,
            phone="(11) 99999-9999",
            status="active",  # Already approved for dev
            voucher_balance=5,  # 5 credits to test
        )
        db.add(partner)
    else:
        # Ensure partner is active with credits for testing
        if partner.status != "active":
            partner.status = "active"
        if partner.voucher_balance < 5:
            partner.voucher_balance = 5
    
    await db.flush()


