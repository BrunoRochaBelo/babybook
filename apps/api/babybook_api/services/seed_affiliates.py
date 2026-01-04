from __future__ import annotations

import secrets
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import Account, Affiliate, User
from babybook_api.security import hash_password
from babybook_api.services.affiliates import get_or_create_program_config


def _code_for(name: str) -> str:
    slug = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    slug = slug or "affiliate"
    return f"{slug}-{secrets.token_hex(3)}"


async def _get_or_create_account(db: AsyncSession, *, name: str, slug: str) -> Account:
    res = await db.execute(select(Account).where(Account.slug == slug))
    account = res.scalar_one_or_none()
    if account:
        return account
    account = Account(name=name, slug=slug)
    db.add(account)
    await db.flush()
    return account


async def _get_or_create_user(
    db: AsyncSession,
    *,
    account_id,
    email: str,
    password: str,
    name: str,
    role: str,
) -> User:
    res = await db.execute(select(User).where(User.email == email.lower()))
    user = res.scalar_one_or_none()
    if user:
        # Dev convenience: alinhar role caso alguém já tenha criado o usuário.
        if user.role != role:
            user.role = role
            await db.flush()
        return user

    user = User(
        account_id=account_id,
        email=email.lower(),
        password_hash=hash_password(password),
        name=name,
        locale="pt-BR",
        role=role,
    )
    db.add(user)
    await db.flush()
    return user


async def _get_or_create_affiliate(
    db: AsyncSession,
    *,
    email: str,
    name: str,
    user_id,
    status: str,
    commission_rate: float,
) -> Affiliate:
    res = await db.execute(select(Affiliate).where(Affiliate.email == email.lower()))
    affiliate = res.scalar_one_or_none()
    if affiliate:
        if affiliate.user_id is None:
            affiliate.user_id = user_id
        if affiliate.status != status:
            affiliate.status = status
        if affiliate.commission_rate != commission_rate:
            affiliate.commission_rate = commission_rate
        await db.flush()
        return affiliate

    affiliate = Affiliate(
        id=uuid4(),
        user_id=user_id,
        code=_code_for(name),
        name=name,
        email=email.lower(),
        status=status,
        commission_rate=commission_rate,
        payout_method={"pix_key": email.lower(), "bank_account": None},
    )
    db.add(affiliate)
    await db.flush()
    return affiliate


async def bootstrap_dev_affiliates(db: AsyncSession) -> None:
    """Seed do portal de afiliados em ambiente local.

    Cria:
    - company_admin: admin@babybook.dev / admin123
    - afiliados: alice@influ.dev / affiliate123 (active), bob@influ.dev / affiliate123 (paused)
    - config singleton do programa

    Idempotente.
    """

    cfg = await get_or_create_program_config(db)

    account = await _get_or_create_account(db, name="Babybook Company", slug="babybook-company")

    await _get_or_create_user(
        db,
        account_id=account.id,
        email="admin@babybook.dev",
        password="admin123",
        name="Admin Babybook",
        role="company_admin",
    )

    alice_user = await _get_or_create_user(
        db,
        account_id=account.id,
        email="alice@influ.dev",
        password="affiliate123",
        name="Alice Influ",
        role="affiliate",
    )
    bob_user = await _get_or_create_user(
        db,
        account_id=account.id,
        email="bob@influ.dev",
        password="affiliate123",
        name="Bob Creator",
        role="affiliate",
    )

    await _get_or_create_affiliate(
        db,
        email="alice@influ.dev",
        name="Alice Influ",
        user_id=alice_user.id,
        status="active",
        commission_rate=float(cfg.default_commission_rate),
    )

    await _get_or_create_affiliate(
        db,
        email="bob@influ.dev",
        name="Bob Creator",
        user_id=bob_user.id,
        status="paused",
        commission_rate=max(0.0, float(cfg.default_commission_rate) - 0.03),
    )
