import asyncio
import sys
import os
from pathlib import Path
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PACKAGE_ROOT))

from babybook_api.db.models import Account, Base, User
from babybook_api.auth.constants import SESSION_COOKIE_NAME
from babybook_api.deps import get_db_session
from babybook_api.main import app
from babybook_api.security import hash_password

DATABASE_URL = "sqlite+aiosqlite:///./babybook_test.db"

engine = create_async_engine(DATABASE_URL, future=True)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db_session] = override_get_db_session

DEFAULT_EMAIL = "ana@example.com"
# DEFAULT_PASSWORD should not be a hardcoded secret in source control.
# Allow override via environment var for CI/dev convenience.
DEFAULT_PASSWORD = os.environ.get("DEFAULT_PASSWORD", "test-password")


async def _reset_db() -> None:
    async with engine.begin() as conn:
        # SQLite às vezes mantém índices entre drop/create no mesmo arquivo.
        # Limpamos índices não-internos para garantir um schema limpo por teste.
        result = await conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        )
        for row in result:
            index_name = row[0]
            # quote defensivo
            await conn.execute(text(f'DROP INDEX IF EXISTS "{index_name}"'))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def _seed_default_user() -> None:
    async with TestingSessionLocal() as session:
        account = Account(name="Familia Ana", slug="familia-ana")
        session.add(account)
        await session.flush()
        user = User(
            account_id=account.id,
            email=DEFAULT_EMAIL,
            password_hash=hash_password(DEFAULT_PASSWORD),
            name="Ana",
            locale="pt-BR",
            role="owner",
        )
        session.add(user)
        await session.commit()


async def _fetch_default_account_id() -> UUID:
    async with TestingSessionLocal() as session:
        result = await session.execute(select(Account.id))
        return result.scalar_one()


@pytest.fixture(autouse=True)
def setup_db() -> None:
    asyncio.run(_reset_db())
    asyncio.run(_seed_default_user())


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def login(client: TestClient) -> None:
    csrf = client.get("/auth/csrf").json()["csrf_token"]
    resp = client.post(
        "/auth/login",
        json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD, "csrf_token": csrf},
    )
    assert resp.status_code == 204
    assert SESSION_COOKIE_NAME in client.cookies


@pytest.fixture
def default_account_id() -> str:
    return str(asyncio.run(_fetch_default_account_id()))
