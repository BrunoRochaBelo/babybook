from babybook_api.settings import settings


def test_get_me_returns_profile_with_etag(client, login):
    response = client.get("/me/")
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "ana@example.com"
    assert body["locale"] == "pt-BR"
    assert "ETag" in response.headers
    assert "X-Trace-Id" in response.headers


def test_patch_me_updates_locale_when_if_match_matches(client, login):
    initial = client.get("/me/")
    etag = initial.headers["ETag"]

    response = client.patch(
        "/me/",
        headers={"If-Match": etag},
        json={"locale": "en-US"},
    )
    assert response.status_code == 200
    assert response.json()["locale"] == "en-US"
    assert response.headers["ETag"] != etag


def test_usage_reflects_created_moments(client, login):
    child_resp = client.post("/children", json={"name": "Bia"})
    child_id = child_resp.json()["id"]

    moment_resp = client.post(
        "/moments",
        json={
            "child_id": child_id,
            "title": "Primeiro sorriso",
            "summary": "Registro do momento guidado",
            "privacy": "private",
        },
    )
    assert moment_resp.status_code == 201

    usage = client.get("/me/usage").json()
    assert usage["bytes_quota"] == settings.quota_storage_bytes
    assert usage["moments_quota"] == settings.quota_moments
    assert usage["moments_used"] == 1
