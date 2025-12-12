"""
Script para criar usuário parceiro de teste.
Execute: python scripts/seed_partner.py
"""
import asyncio
import sys
from pathlib import Path

# Add api to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from babybook_api.db.models import Account, Partner, User
from babybook_api.security import hash_password
from babybook_api.settings import settings

# Credentials
PRO_USER_EMAIL = "pro@babybook.dev"
PRO_USER_PASSWORD = "pro123"
PRO_USER_NAME = "Maria Fotógrafa"
PRO_STUDIO_NAME = "Estúdio Demo"


async def seed_partner():
    """Cria usuário parceiro para testes."""
    engine = create_async_engine(settings.database_url, future=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    
    try:
        async with session_factory() as session:
            # Check if user exists
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
                    role="photographer",
                )
                session.add(user)
                await session.flush()
                print(f"✓ Usuário criado: {PRO_USER_EMAIL}")
            else:
                if user.role != "photographer":
                    user.role = "photographer"
                    print(f"✓ Role atualizado para photographer")
                else:
                    print(f"• Usuário já existe: {PRO_USER_EMAIL}")
            
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
                    status="active",
                    voucher_balance=5,
                )
                session.add(partner)
                print(f"✓ Partner criado: {PRO_STUDIO_NAME}")
            else:
                if partner.status != "active":
                    partner.status = "active"
                    print(f"✓ Partner ativado")
                if partner.voucher_balance < 5:
                    partner.voucher_balance = 5
                    print(f"✓ Créditos ajustados para 5")
                else:
                    print(f"• Partner já existe com {partner.voucher_balance} créditos")
            
            await session.commit()
            
            print("\n" + "="*50)
            print("CREDENCIAIS DO PARCEIRO DE TESTE")
            print("="*50)
            print(f"Email:    {PRO_USER_EMAIL}")
            print(f"Senha:    {PRO_USER_PASSWORD}")
            print(f"Créditos: {partner.voucher_balance}")
            print("="*50)
            
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_partner())
