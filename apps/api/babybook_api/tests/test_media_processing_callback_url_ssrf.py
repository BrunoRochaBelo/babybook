def test_media_processing_rejects_external_callback_url(client, login):
    resp = client.post(
        "/media/processing/transcode",
        json={
            "asset_id": "asset_1",
            "source_key": "u/some-user/m/some-moment/video.mp4",
            "callback_url": "https://evil.example/cb",
        },
    )
    assert resp.status_code == 400


def test_media_processing_allows_frontend_callback_url_same_host(client, login):
    # settings.frontend_url em tests/local geralmente é http://localhost:5173
    resp = client.post(
        "/media/processing/transcode",
        json={
            "asset_id": "asset_2",
            "source_key": "u/some-user/m/some-moment/video.mp4",
            "callback_url": "http://localhost:5173/hooks/media-done",
        },
    )
    assert resp.status_code == 202
    body = resp.json()
    assert "job_id" in body
