from __future__ import annotations

import asyncio
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from babybook_api.db.models import Account, Affiliate, User
from babybook_api.security import hash_password
from babybook_api.tests.conftest import TestingSessionLocal


async def _seed_affiliate_portal() -> dict[str, str]:
    async with TestingSessionLocal() as session:
        account = Account(name="Babybook Company", slug="babybook-company")
        session.add(account)
        await session.flush()

        admin = User(
            account_id=account.id,
            email="admin@babybook.dev",
            password_hash=hash_password("admin123"),
            name="Admin Babybook",
            locale="pt-BR",
            role="company_admin",
        )
        session.add(admin)

        alice_user = User(
            account_id=account.id,
            email="alice@influ.dev",
            password_hash=hash_password("affiliate123"),
            name="Alice Influ",
            locale="pt-BR",
            role="affiliate",
        )
        session.add(alice_user)
        await session.flush()

        alice_aff = Affiliate(
            id=uuid4(),
            user_id=alice_user.id,
            code="alice-influ-01",
            name="Alice Influ",
            email="alice@influ.dev",
            status="active",
            commission_rate=0.15,
            payout_method={"pix_key": "alice@influ.dev", "bank_account": None},
        )
        session.add(alice_aff)

        await session.commit()

        return {
            "account_id": str(account.id),
            "admin_user_id": str(admin.id),
            "alice_user_id": str(alice_user.id),
            "alice_affiliate_id": str(alice_aff.id),
        }


def _login_portal(client: TestClient, *, email: str, password: str, role: str) -> dict:
    resp = client.post("/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200
    return resp.json()


def test_auth_login_portal_company_admin(client: TestClient) -> None:
    asyncio.run(_seed_affiliate_portal())

    data = _login_portal(client, email="admin@babybook.dev", password="admin123", role="company_admin")
    assert data["role"] == "company_admin"
    assert data["email"] == "admin@babybook.dev"
    assert data["affiliate_id"] is None


def test_affiliate_flow_sale_to_payout(client: TestClient) -> None:
    seeded = asyncio.run(_seed_affiliate_portal())
    affiliate_id = seeded["alice_affiliate_id"]

    # Admin registra uma venda
    _login_portal(client, email="admin@babybook.dev", password="admin123", role="company_admin")

    sale_resp = client.post(
        "/admin/sales",
        json={
            "affiliate_id": affiliate_id,
            "amount_cents": 50_000,
        },
    )
    assert sale_resp.status_code == 201
    sale = sale_resp.json()
    assert sale["affiliate_id"] == affiliate_id
    assert sale["amount_cents"] == 50_000
    assert sale["commission_cents"] == 7_500
    assert sale["status"] == "approved"

    # Afiliado vê saldo e solicita payout
    _login_portal(client, email="alice@influ.dev", password="affiliate123", role="affiliate")

    me = client.get("/affiliate/me")
    assert me.status_code == 200
    me_data = me.json()
    assert me_data["balance_cents"] == 7_500

    payout_resp = client.post("/affiliate/payouts/request")
    assert payout_resp.status_code == 201
    payout = payout_resp.json()
    assert payout["affiliate_id"] == affiliate_id
    assert payout["amount_cents"] == 7_500
    assert payout["status"] == "requested"

    me2 = client.get("/affiliate/me")
    assert me2.status_code == 200
    me2_data = me2.json()
    assert me2_data["balance_cents"] == 0
    assert any(p["id"] == payout["id"] for p in me2_data["payouts"])
