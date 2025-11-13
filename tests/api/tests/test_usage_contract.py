import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
import yaml

from babybook_api.main import app

client = TestClient(app)
openapi_path = Path(__file__).resolve().parents[3] / "apps" / "api" / "babybook_api" / "openapi.yaml"


@pytest.mark.contract
def test_usage_schema_matches_openapi():
    response = client.get("/me/usage")
    assert response.status_code == 200
    payload = response.json()

    spec = yaml.safe_load(openapi_path.read_text())
    schema_properties = set(
        spec["components"]["schemas"]["QuotaResponse"]["properties"].keys()
    )
    assert schema_properties == set(payload.keys())
