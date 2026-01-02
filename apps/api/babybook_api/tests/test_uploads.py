from __future__ import annotations

import asyncio
from datetime import datetime
from uuid import UUID

from fastapi.testclient import TestClient

from babybook_api.db.models import Asset
from babybook_api.main import app
from babybook_api.services.inline_worker import process_inline_job
from babybook_api.services.queue import get_queue_publisher
from babybook_api.storage.base import PresignedUrlResult
from app import queue as worker_queue

from .conftest import TestingSessionLocal


def test_upload_flow_and_dedup(monkeypatch, client: TestClient, login: None) -> None:
    # Evita dependência de MinIO real nos testes: mocka storage presigned.
    from babybook_api.routes import uploads as uploads_routes

    class FakeStorage:
        async def generate_presigned_put_url(self, *, key: str, content_type: str, expires_in, metadata=None):
            return PresignedUrlResult(
                url=f"https://presigned.test/{key}",
                method="PUT",
                expires_at=datetime.utcnow(),
                headers={},
            )

    async def fake_get_cold_storage():
        return FakeStorage()

    monkeypatch.setattr(uploads_routes, "get_cold_storage", fake_get_cold_storage)

    child_resp = client.post("/children", json={"name": "Bebe"})
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    init_payload = {
        "child_id": child_id,
        "filename": "video.mp4",
        "size": 5 * 1024 * 1024,
        "mime": "video/mp4",
        "sha256": "a" * 64,
        "kind": "video",
    }
    init_resp = client.post("/uploads/init", json=init_payload)
    assert init_resp.status_code == 200
    data = init_resp.json()
    assert data["upload_id"]
    assert len(data["parts"]) >= 1

    etags = [{"part": part, "etag": f"etag-{part}"} for part in data["parts"]]
    complete_resp = client.post(
        "/uploads/complete",
        json={"upload_id": data["upload_id"], "etags": etags},
    )
    assert complete_resp.status_code == 202
    complete_data = complete_resp.json()
    assert complete_data["asset_id"] == data["asset_id"]

    dedup_resp = client.post("/uploads/init", json=init_payload)
    assert dedup_resp.status_code == 200
    dedup_data = dedup_resp.json()
    assert dedup_data["deduplicated"] is True
    assert dedup_data["upload_id"] is None
    assert dedup_data["asset_id"] == data["asset_id"]

    asset = asyncio.run(_fetch_asset(UUID(data["asset_id"])))
    assert asset.status == "ready"
    assert asset.viewer_accessible is True
    assert asset.child_id == UUID(child_id)


async def _fetch_asset(asset_id: UUID) -> Asset:
    async with TestingSessionLocal() as session:
        asset = await session.get(Asset, asset_id)
        assert asset is not None
        return asset


def test_upload_processed_by_worker(monkeypatch, client: TestClient, login: None) -> None:
    # Evita dependência de MinIO real nos testes: mocka storage presigned.
    from babybook_api.routes import uploads as uploads_routes

    class FakeStorage:
        async def generate_presigned_put_url(self, *, key: str, content_type: str, expires_in, metadata=None):
            return PresignedUrlResult(
                url=f"https://presigned.test/{key}",
                method="PUT",
                expires_at=datetime.utcnow(),
                headers={},
            )

    async def fake_get_cold_storage():
        return FakeStorage()

    monkeypatch.setattr(uploads_routes, "get_cold_storage", fake_get_cold_storage)

    published: list[tuple[str, dict, dict]] = []

    child_resp = client.post("/children", json={"name": "Bebe"})
    assert child_resp.status_code == 201
    child_id = child_resp.json()["id"]

    class CapturePublisher:
        async def publish(self, *, kind: str, payload: dict, metadata: dict | None = None) -> None:
            published.append((kind, payload, metadata or {}))

    def override_queue_publisher() -> CapturePublisher:
        return CapturePublisher()

    app.dependency_overrides[get_queue_publisher] = override_queue_publisher
    try:
        init_payload = {
            "child_id": child_id,
            "filename": "photo.jpg",
            "size": 1024,
            "mime": "image/jpeg",
            "sha256": "b" * 64,
            "kind": "photo",
        }
        init_resp = client.post("/uploads/init", json=init_payload)
        assert init_resp.status_code == 200
        upload_id = init_resp.json()["upload_id"]
        parts = init_resp.json()["parts"]
        etags = [{"part": part, "etag": f"etag-{part}"} for part in parts]
        complete_resp = client.post("/uploads/complete", json={"upload_id": upload_id, "etags": etags})
        assert complete_resp.status_code == 202
    finally:
        app.dependency_overrides.pop(get_queue_publisher, None)

    assert published, "Job não publicado na fila"
    job_kind, job_payload, job_metadata = published[0]
    assert job_kind == "image.thumbnail"

    async def _process_job() -> None:
        class DummyBackend:
            async def ack(self, message, *, success: bool, error: str | None = None) -> None:
                assert success is True

        async def fake_handler(payload: dict, metadata: dict) -> None:
            async with TestingSessionLocal() as session:
                await process_inline_job(session, kind=job_kind, payload=payload)

        original_handler = worker_queue.JOB_MAP[job_kind]
        worker_queue.JOB_MAP[job_kind] = fake_handler
        try:
            consumer = worker_queue.QueueConsumer(concurrency=1)
            consumer.backend = DummyBackend()
            message = worker_queue.QueueMessage(
                id=job_payload["asset_id"],
                kind=job_kind,
                payload=job_payload,
                metadata=job_metadata,
            )
            await consumer._handle_message(message)
        finally:
            worker_queue.JOB_MAP[job_kind] = original_handler

    asyncio.run(_process_job())
    asset = asyncio.run(_fetch_asset(UUID(job_payload["asset_id"])))
    assert asset.status == "ready"
