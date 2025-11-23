from __future__ import annotations

import asyncio
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import select

from babybook_api.db.models import User, Account
from babybook_api.tests.conftest import TestingSessionLocal


def test_register_creates_user_and_session(client: TestClient) -> None:
    csrf = client.get("/auth/csrf").json()["csrf_token"]
    resp = client.post("/auth/register", json={"email": "newuser@example.com", "password": "secret123", "csrf_token": csrf, "name": "New User"})
    assert resp.status_code == 201
    # Session cookie set
    assert "__Host-session" in client.cookies

    # user created in db
    async def _find_user():
        async with TestingSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == "newuser@example.com"))
            user = result.scalar_one_or_none()
            return user

    user = asyncio.run(_find_user())
    assert user is not None
