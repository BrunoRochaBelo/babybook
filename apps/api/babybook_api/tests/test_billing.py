from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import select

from babybook_api.db.models import Account
from babybook_api.settings import settings
from babybook_api.tests.conftest import TestingSessionLocal


async def _fetch_entitlements(account_id: str) -> tuple[bool, bool, bool]:
    async with TestingSessionLocal() as session:
        result = await session.execute(select(Account).where(Account.id == UUID(account_id)))
        account = result.scalar_one()
        return (
            account.unlimited_social,
            account.unlimited_creative,
            account.unlimited_tracking,
        )


def test_billing_webhook_sets_entitlement(client: TestClient, default_account_id: str) -> None:
    settings.billing_webhook_secret = "test-secret"
    payload = {
        "id": "evt_test",
        "data": {
            "object": {
                "amount": 2900,
                "currency": "brl",
                "metadata": {
                    "account_id": default_account_id,
                    "package_key": "unlimited_social",
                },
            }
        },
    }
    body = json.dumps(payload).encode("utf-8")
    signature = hmac.new(settings.billing_webhook_secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    resp = client.post(
        "/webhooks/payment",
        data=body,
        headers={"X-Billing-Signature": signature, "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    entitlements = asyncio.run(_fetch_entitlements(default_account_id))
    assert entitlements[0] is True

    dedup_resp = client.post(
        "/webhooks/payment",
        data=body,
        headers={"X-Billing-Signature": signature, "Content-Type": "application/json"},
    )
    assert dedup_resp.status_code == 200
