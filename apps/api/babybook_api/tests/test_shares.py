def _create_child(client):
    resp = client.post("/children", json={"name": "Bia"})
    assert resp.status_code == 201
    return resp.json()["id"]


def _create_moment(client, child_id: str) -> str:
    resp = client.post(
        "/moments",
        json={
            "child_id": child_id,
            "title": "Momento Compartilhavel",
            "summary": "História para convidados",
            "privacy": "people",
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def _publish_moment(client, moment_id: str) -> None:
    resp = client.post(f"/moments/{moment_id}/publish")
    assert resp.status_code == 200


def test_share_flow_and_public_guestbook(client, login):
    child_id = _create_child(client)
    moment_id = _create_moment(client, child_id)
    _publish_moment(client, moment_id)

    share_resp = client.post(f"/moments/{moment_id}/share", json={"expires_at": None})
    assert share_resp.status_code == 201
    share = share_resp.json()

    public = client.get(f"/shares/{share['token']}")
    assert public.status_code == 200
    assert public.json()["moment"]["id"] == moment_id

    guestbook_payload = {
        "child_id": child_id,
        "author_name": "Convidado",
        "author_email": "guest@example.com",
        "message": "Parabens pelo momento!",
    }
    gb_resp = client.post(f"/shares/{share['token']}/guestbook", json=guestbook_payload)
    assert gb_resp.status_code == 201
    assert gb_resp.json()["status"] == "pending"

    entries = client.get("/guestbook").json()
    assert len(entries["items"]) == 1
