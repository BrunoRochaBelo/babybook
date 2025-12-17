import asyncio
import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import yaml

from babybook_api.main import app
from babybook_api.db.models import Account, Base, User
from babybook_api.deps import get_db_session
from babybook_api.security import hash_password

client = TestClient(app)
openapi_path = Path(__file__).resolve().parents[3] / "apps" / "api" / "babybook_api" / "openapi.yaml"


# --- Infra de teste (DB + seed) ---
# Reutiliza o mesmo DB de testes do pacote apps/api para evitar inconsistências
# caso outras suítes também dependam de overrides no app global.
DATABASE_URL = "sqlite+aiosqlite:///./babybook_test.db"
engine = create_async_engine(DATABASE_URL, future=True)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session


async def _reset_db() -> None:
    async with engine.begin() as conn:
        # SQLite às vezes mantém índices entre drop/create no mesmo arquivo.
        result = await conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        )
        for row in result:
            index_name = row[0]
            await conn.execute(text(f'DROP INDEX IF EXISTS "{index_name}"'))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def _seed_default_user() -> None:
    default_email = "ana@example.com"
    default_password = os.environ.get("DEFAULT_PASSWORD", "test-password")
    async with TestingSessionLocal() as session:
        account = Account(name="Familia Ana", slug="familia-ana")
        session.add(account)
        await session.flush()
        user = User(
            account_id=account.id,
            email=default_email,
            password_hash=hash_password(default_password),
            name="Ana",
            locale="pt-BR",
            role="owner",
        )
        session.add(user)
        await session.commit()


@pytest.fixture(scope="module", autouse=True)
def _setup_contract_db() -> None:
    previous_override = app.dependency_overrides.get(get_db_session)
    app.dependency_overrides[get_db_session] = override_get_db_session
    asyncio.run(_reset_db())
    asyncio.run(_seed_default_user())
    try:
        yield
    finally:
        if previous_override is not None:
            app.dependency_overrides[get_db_session] = previous_override
        else:
            app.dependency_overrides.pop(get_db_session, None)


def _login() -> None:
    csrf = client.get("/auth/csrf").json()["csrf_token"]
    password = os.environ.get("DEFAULT_PASSWORD", "test-password")
    resp = client.post(
        "/auth/login",
        json={"email": "ana@example.com", "password": password, "csrf_token": csrf},
    )
    assert resp.status_code == 204


@pytest.mark.contract
def test_usage_schema_matches_openapi():
    _login()
    response = client.get("/me/usage")
    assert response.status_code == 200
    payload = response.json()

    spec = yaml.safe_load(openapi_path.read_text())
    schema_properties = set(spec["components"]["schemas"]["Usage"]["properties"].keys())
    assert schema_properties == set(payload.keys())
