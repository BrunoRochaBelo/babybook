from __future__ import annotations

from fastapi.testclient import TestClient


def test_upload_flow_and_dedup(client: TestClient, login: None) -> None:
    init_payload = {
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
