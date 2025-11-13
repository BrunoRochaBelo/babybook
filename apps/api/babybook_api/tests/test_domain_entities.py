from __future__ import annotations

import asyncio
from datetime import datetime
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from babybook_api.db.models import Asset, SeriesOccurrence
from babybook_api.tests.conftest import TestingSessionLocal


async def _create_occurrence(series_id: str, account_id: str) -> None:
    async with TestingSessionLocal() as session:
        occurrence = SeriesOccurrence(
            series_id=UUID(series_id),
            account_id=UUID(account_id),
            scheduled_at=datetime.utcnow(),
        )
        session.add(occurrence)
        await session.commit()


async def _create_asset(account_id: str) -> str:
    async with TestingSessionLocal() as session:
        asset = Asset(
            account_id=UUID(account_id),
            kind="photo",
            status="ready",
            mime="image/png",
            size_bytes=1024,
            sha256=uuid4().hex,
        )
        session.add(asset)
        await session.commit()
        return str(asset.id)


def _create_child(client: TestClient) -> str:
    resp = client.post("/children", json={"name": "Bebe"})
    assert resp.status_code == 201
    return resp.json()["id"]


def _create_moment(client: TestClient, child_id: str) -> str:
    resp = client.post("/moments", json={"child_id": child_id, "title": "Momento"})
    assert resp.status_code == 201
    return resp.json()["id"]


def test_series_occurrence_listing(client: TestClient, login: None, default_account_id: str) -> None:
    create_resp = client.post(
        "/series",
        json={"name": "Mesversario", "rrule": "FREQ=MONTHLY;BYMONTHDAY=10", "tz": "UTC"},
    )
    assert create_resp.status_code == 201
    series_id = create_resp.json()["id"]
    asyncio.run(_create_occurrence(series_id, default_account_id))

    list_resp = client.get(f"/series/{series_id}/occurrences")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1


def test_chapter_flow(client: TestClient, login: None) -> None:
    child_id = _create_child(client)
    chapter_resp = client.post(
        "/chapters",
        json={"child_id": child_id, "title": "Primeiros Passos"},
    )
    assert chapter_resp.status_code == 201
    chapter_id = chapter_resp.json()["id"]

    details = client.get(f"/chapters/{chapter_id}")
    etag = details.headers["etag"]
    patch_resp = client.patch(
        f"/chapters/{chapter_id}",
        headers={"If-Match": etag},
        json={"description": "Atualizado"},
    )
    assert patch_resp.status_code == 200
    moment_one = _create_moment(client, child_id)
    moment_two = _create_moment(client, child_id)

    attach_resp = client.post(
        f"/chapters/{chapter_id}/moments",
        json={"add": [moment_one, moment_two]},
    )
    assert attach_resp.status_code == 200
    assert len(attach_resp.json()["moment_ids"]) == 2

    order_resp = client.put(
        f"/chapters/{chapter_id}/order",
        json={"order": [moment_two, moment_one]},
    )
    assert order_resp.status_code == 204

    delete_resp = client.delete(f"/chapters/{chapter_id}")
    assert delete_resp.status_code == 204


def test_vault_document_flow(client: TestClient, login: None, default_account_id: str) -> None:
    child_id = _create_child(client)
    asset_id = asyncio.run(_create_asset(default_account_id))
    create_resp = client.post(
        "/vault/documents",
        json={"child_id": child_id, "kind": "certidao", "asset_id": asset_id, "note": "Certidao"},
    )
    assert create_resp.status_code == 201

    list_resp = client.get("/vault/documents", params={"child_id": child_id})
    assert list_resp.status_code == 200
    docs = list_resp.json()["items"]
    assert len(docs) == 1
    assert docs[0]["asset_id"] == asset_id
