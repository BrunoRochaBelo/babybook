import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
import yaml

from babybook_api.main import app

client = TestClient(app)
openapi_path = Path(__file__).resolve().parents[3] / "apps" / "api" / "babybook_api" / "openapi.yaml"


def _login() -> None:
    csrf = client.get("/auth/csrf").json()["csrf_token"]
    resp = client.post(
        "/auth/login",
        json={"email": "ana@example.com", "password": "senha123", "csrf_token": csrf},
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
