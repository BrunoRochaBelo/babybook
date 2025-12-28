from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from babybook_api.auth.constants import SESSION_COOKIE_NAME


@pytest.mark.parametrize("provider", ["google", "microsoft", "apple"])
def test_oauth_dev_authorize_creates_session_and_redirects(client: TestClient, provider: str) -> None:
    # Step 1: GET authorize page
    resp = client.get(f"/auth/{provider}/authorize?state=/jornada")
    assert resp.status_code == 200
    assert "Mock OAuth consent" in resp.text or "Mock OAuth" in resp.text

    # Step 2: POST authorize (simulate user consenting)
    resp2 = client.post(
        f"/auth/{provider}/authorize",
        data={"action": "authorize", "state": "/jornada"},
        follow_redirects=False,
    )
    # Should redirect to callback
    assert resp2.status_code in (302, 303, 307)
    # Follow redirect to callback
    # Callback will set session cookie and redirect to /jornada
    location = resp2.headers.get("location")
    assert "/auth/" in location or location.startswith("/")
    # Now call the callback result; for test client we'll call the callback directly
    callback_resp = client.get(location, follow_redirects=False)
    assert callback_resp.status_code in (302, 303, 307)
    assert SESSION_COOKIE_NAME in client.cookies
    me = client.get("/me/")
    assert me.status_code == 200
    assert provider in me.json()["email"]
