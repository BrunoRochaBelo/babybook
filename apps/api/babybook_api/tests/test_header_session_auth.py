import os

from babybook_api.auth.constants import SESSION_COOKIE_NAME
from babybook_api.settings import settings


def _login_and_get_session_token(client):
    csrf = client.get("/auth/csrf").json()["csrf_token"]
    password = os.environ.get("DEFAULT_PASSWORD", "test-password")
    resp = client.post(
        "/auth/login",
        json={"email": "ana@example.com", "password": password, "csrf_token": csrf},
    )
    assert resp.status_code == 204
    token = client.cookies.get(SESSION_COOKIE_NAME)
    assert token
    return resp, token


def test_header_session_auth_is_ignored_in_production_when_flag_off(client, monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production", raising=False)
    monkeypatch.setattr(settings, "allow_header_session_auth", False, raising=False)

    resp, token = _login_and_get_session_token(client)

    # Em produção, o backend não deve "vazar" o token via header por padrão.
    assert "X-BB-Session" not in resp.headers

    # Se o cookie não existir, o header não pode autenticar quando flag está desligado.
    client.cookies.clear()
    me = client.get("/me/", headers={"X-BB-Session": token})
    assert me.status_code == 401


def test_header_session_auth_is_accepted_in_production_when_flag_on(client, monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production", raising=False)
    monkeypatch.setattr(settings, "allow_header_session_auth", True, raising=False)

    resp, token = _login_and_get_session_token(client)

    # Quando explicitamente habilitado, o backend pode expor o token (útil em E2E).
    assert resp.headers.get("X-BB-Session") == token

    client.cookies.clear()
    me = client.get("/me/", headers={"X-BB-Session": token})
    assert me.status_code == 200
    assert me.json()["email"] == "ana@example.com"
