from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from typing import Any, AsyncIterator

from rich.console import Console
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from babybook_api.db.models import (
    Account,
    AppPolicy,
    Child,
    Moment,
    MomentTemplate,
    ShareLink,
)
from babybook_api.services.auth import bootstrap_dev_user
from babybook_api.settings import settings

console = Console()

BASE_POLICY = {
    "photos_per_moment": 3,
    "audios_per_moment": 1,
    "video_max_sec": 10,
    "recurrent_moment_limit": 5,
    "guestbook_default_limit": 50,
    "guestbook_allow_media": False,
}

MOMENT_TEMPLATES: list[dict[str, Any]] = [
    {
        "key": "primeiro_sorriso",
        "display_name": "Primeiro Sorriso",
        "upsell_category": "creative",
        "limits": {"photo": 3, "video": 1},
        "rules": {"max_text": 500},
        "prompt_microcopy": {
            "pt": "Compartilhe como foi o primeiro sorriso inesquec�vel.",
            "en": "Tell us about that unforgettable first smile.",
        },
        "data_schema": {
            "type": "object",
            "properties": {
                "descricao": {"type": "string"},
                "data": {"type": "string", "format": "date"},
            },
        },
        "ui_schema": {
            "descricao": {"ui:widget": "textarea", "ui:placeholder": "O que aconteceu?"},
            "data": {"ui:widget": "date"},
        },
        "order_index": 10,
    },
    {
        "key": "primeiro_banho",
        "display_name": "Primeiro Banho",
        "upsell_category": "social",
        "limits": {"photo": 4, "video": 1},
        "rules": {"allow_guestbook": True},
        "prompt_microcopy": {
            "pt": "Registre o banho que marcou a hist�ria.",
            "en": "Capture the bath that became part of the story.",
        },
        "data_schema": {
            "type": "object",
            "properties": {
                "onde": {"type": "string"},
                "quem_participou": {"type": "string"},
            },
        },
        "ui_schema": {
            "onde": {"ui:placeholder": "Na casa da vov�"},
            "quem_participou": {"ui:widget": "textarea"},
        },
        "order_index": 20,
    },
    {
        "key": "marco_de_saude",
        "display_name": "Marco de Sa�de",
        "upsell_category": "tracking",
        "limits": {"photo": 2},
        "rules": {"require_date": True},
        "prompt_microcopy": {
            "pt": "Acompanhe ganhos de peso, altura e consultas importantes.",
            "en": "Track weight, height and noteworthy checkups.",
        },
        "data_schema": {
            "type": "object",
            "properties": {
                "peso_kg": {"type": "number"},
                "altura_cm": {"type": "number"},
                "observacoes": {"type": "string"},
            },
        },
        "ui_schema": {
            "peso_kg": {"ui:widget": "number", "ui:placeholder": "Ex.: 5.2"},
            "altura_cm": {"ui:widget": "number"},
            "observacoes": {"ui:widget": "textarea"},
        },
        "order_index": 30,
    },
]

DEMO_USER_EMAIL = "demo@babybook.dev"
DEMO_USER_PASSWORD = "demo123"
DEMO_ACCOUNT_NAME = "Fam�lia Demo"
DEMO_SHARE_TOKEN = "demo-stack-token"


@asynccontextmanager
async def _session_scope(database_url: str | None = None) -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(database_url or settings.database_url, future=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory() as session:
            yield session
    finally:
        await engine.dispose()


async def seed_moment_templates(database_url: str | None = None) -> int:
    async with _session_scope(database_url) as session:
        existing_keys = set(
            (
                await session.execute(
                    select(MomentTemplate.key).where(MomentTemplate.account_id.is_(None))
                )
            ).scalars()
        )
        created = 0
        for idx, template in enumerate(MOMENT_TEMPLATES):
            if template["key"] in existing_keys:
                continue
            template_data = dict(template)
            order_index = template_data.pop("order_index", (idx + 1) * 10)
            version = template_data.pop("version", 1)
            session.add(
                MomentTemplate(
                    account_id=None,
                    order_index=order_index,
                    version=version,
                    **template_data,
                )
            )
            created += 1
        await session.commit()
        return created


async def seed_base_plan_policies(database_url: str | None = None) -> int:
    async with _session_scope(database_url) as session:
        account_ids = (await session.execute(select(Account.id))).scalars().all()
        if not account_ids:
            return 0
        existing = set((await session.execute(select(AppPolicy.account_id))).scalars())
        created = 0
        for account_id in account_ids:
            if account_id in existing:
                continue
            session.add(AppPolicy(account_id=account_id, **BASE_POLICY))
            created += 1
        await session.commit()
        return created


async def seed_demo_data(database_url: str | None = None) -> dict[str, str]:
    async with _session_scope(database_url) as session:
        user = await bootstrap_dev_user(
            session,
            DEMO_USER_EMAIL,
            DEMO_USER_PASSWORD,
            DEMO_ACCOUNT_NAME,
        )
        account_id = user.account_id

        child = (
            await session.execute(
                select(Child).where(Child.account_id == account_id, Child.deleted_at.is_(None))
            )
        ).scalar_one_or_none()
        if child is None:
            child = Child(
                account_id=account_id,
                name="Luna Demo",
                birthday=date(2023, 5, 14),
            )
            session.add(child)

        moment = (
            await session.execute(
                select(Moment).where(
                    Moment.account_id == account_id,
                    Moment.child == child,
                    Moment.status == "published",
                )
            )
        ).scalar_one_or_none()
        now = datetime.now(tz=timezone.utc)
        if moment is None:
            moment = Moment(
                account_id=account_id,
                child=child,
                title="Primeiro sorriso",
                summary="Seed de demonstra��o para testes E2E.",
                occurred_at=now,
                status="published",
                privacy="public",
                published_at=now,
            )
            session.add(moment)

        share = (
            await session.execute(
                select(ShareLink).where(
                    ShareLink.account_id == account_id,
                    ShareLink.moment == moment,
                    ShareLink.revoked_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if share is None:
            share = ShareLink(
                account_id=account_id,
                moment=moment,
                token=DEMO_SHARE_TOKEN,
            )
            session.add(share)
        else:
            share.token = DEMO_SHARE_TOKEN
            share.revoked_at = None

        await session.commit()
        return {
            "share_token": share.token,
            "user_email": DEMO_USER_EMAIL,
            "user_password": DEMO_USER_PASSWORD,
        }


# =============================================================================
# Partner/Photographer Demo User
# =============================================================================

PRO_USER_EMAIL = "pro@babybook.dev"
PRO_USER_PASSWORD = "pro123"
PRO_USER_NAME = "Maria Fotógrafa"
PRO_STUDIO_NAME = "Estúdio Demo"


async def seed_partner_data(database_url: str | None = None) -> dict[str, str]:
    """
    Cria um usuário parceiro (fotógrafo) para testes locais.
    
    - User com role 'photographer'
    - Partner com status 'active' 
    - 5 créditos de voucher para testar fluxo completo
    """
    from uuid import uuid4

    from babybook_api.db.models import Account, Partner, User
    from babybook_api.security import hash_password
    
    async with _session_scope(database_url) as session:
        # Check if user already exists
        result = await session.execute(
            select(User).where(User.email == PRO_USER_EMAIL.lower())
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            # Create account
            account = Account(
                name=PRO_STUDIO_NAME,
                slug="estudio-demo",
            )
            session.add(account)
            await session.flush()
            
            # Create user with photographer role
            user = User(
                account_id=account.id,
                email=PRO_USER_EMAIL.lower(),
                password_hash=hash_password(PRO_USER_PASSWORD),
                name=PRO_USER_NAME,
                locale="pt-BR",
                role="photographer",  # Important: photographer role
            )
            session.add(user)
            await session.flush()
            console.print(f"[green]Usuário criado:[/green] {PRO_USER_EMAIL}")
        else:
            # Ensure role is photographer
            if user.role != "photographer":
                user.role = "photographer"
                console.print("[yellow]Role atualizado para photographer[/yellow]")
        
        # Check if partner exists
        result = await session.execute(
            select(Partner).where(Partner.user_id == user.id)
        )
        partner = result.scalar_one_or_none()
        
        if partner is None:
            partner = Partner(
                id=uuid4(),
                user_id=user.id,
                name=PRO_USER_NAME,
                email=PRO_USER_EMAIL.lower(),
                slug="estudio-demo",
                company_name=PRO_STUDIO_NAME,
                phone="(11) 99999-9999",
                status="active",  # Already approved
                voucher_balance=5,  # 5 credits to test
            )
            session.add(partner)
            console.print(f"[green]Partner criado:[/green] {PRO_STUDIO_NAME}")
        else:
            # Ensure partner is active with credits
            if partner.status != "active":
                partner.status = "active"
                console.print("[yellow]Partner ativado[/yellow]")
            if partner.voucher_balance < 5:
                partner.voucher_balance = 5
                console.print("[yellow]Créditos ajustados para 5[/yellow]")
        
        await session.commit()
        
        return {
            "user_email": PRO_USER_EMAIL,
            "user_password": PRO_USER_PASSWORD,
            "partner_id": str(partner.id),
            "voucher_balance": str(partner.voucher_balance),
        }


def seed_moment_templates_command(database_url: str | None = None) -> None:
    inserted = asyncio.run(seed_moment_templates(database_url))
    console.print(f"[green]Templates upserted:[/green] {inserted}")


def seed_base_plan_command(database_url: str | None = None) -> None:
    inserted = asyncio.run(seed_base_plan_policies(database_url))
    console.print(f"[green]Plan policies created:[/green] {inserted}")


def seed_demo_data_command(database_url: str | None = None) -> None:
    payload = asyncio.run(seed_demo_data(database_url))
    console.print(
        "[green]Seed demo atualizado:[/green] "
        f"{payload['user_email']} / {payload['user_password']} (share={payload['share_token']})"
    )


def seed_partner_data_command(database_url: str | None = None) -> None:
    """Criar usuário parceiro/fotógrafo de teste."""
    payload = asyncio.run(seed_partner_data(database_url))
    console.print(
        "[green]Parceiro de teste criado:[/green]\n"
        f"  Email: {payload['user_email']}\n"
        f"  Senha: {payload['user_password']}\n"
        f"  Partner ID: {payload['partner_id']}\n"
        f"  Créditos: {payload['voucher_balance']}"
    )

