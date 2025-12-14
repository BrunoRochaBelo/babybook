from fastapi.testclient import TestClient

from babybook_api.tests.conftest import DEFAULT_EMAIL, DEFAULT_PASSWORD


def test_logout_requires_csrf_header(client: TestClient) -> None:
    csrf = client.get("/auth/csrf").json()["csrf_token"]

    resp = client.post(
        "/auth/login",
        json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD, "csrf_token": csrf},
    )
    assert resp.status_code == 204
    assert "__Host-session" in client.cookies

    # Sem header -> deve bloquear (proteção contra CSRF-based logout)
    resp = client.post("/auth/logout")
    assert resp.status_code == 403

    # Com header -> permite revogar
    resp = client.post("/auth/logout", headers={"X-CSRF-Token": csrf})
    assert resp.status_code == 204
