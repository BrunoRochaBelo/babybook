from __future__ import annotations

import asyncio
from datetime import datetime
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, func

from babybook_api.auth.constants import SESSION_COOKIE_NAME
from babybook_api.db.models import Account, Child, Delivery, Partner, PartnerLedger, User
from babybook_api.main import app
from babybook_api.security import hash_password
from babybook_api.storage import CopyResult, get_partner_storage

from .conftest import TestingSessionLocal


def _csrf(client: TestClient) -> str:
    return client.get("/auth/csrf").json()["csrf_token"]


def _login(client: TestClient, *, email: str, password: str) -> str:
    csrf = _csrf(client)
    resp = client.post(
        "/auth/login",
        json={"email": email, "password": password, "csrf_token": csrf},
    )
    assert resp.status_code == 204
    assert SESSION_COOKIE_NAME in client.cookies
    return csrf


async def _get_user_by_email(email: str) -> User:
    async with TestingSessionLocal() as session:
        row = await session.execute(select(User).where(User.email == email))
        user = row.scalar_one_or_none()
        assert user is not None
        return user


async def _create_paid_child_for_account(account_id: uuid.UUID, *, name: str = "Bebê") -> Child:
    async with TestingSessionLocal() as session:
        child = Child(id=uuid.uuid4(), account_id=account_id, name=name, pce_status="paid")
        session.add(child)
        await session.commit()
        return child


async def _create_unpaid_child_for_account(account_id: uuid.UUID, *, name: str = "Bebê") -> Child:
    async with TestingSessionLocal() as session:
        child = Child(id=uuid.uuid4(), account_id=account_id, name=name, pce_status="unpaid")
        session.add(child)
        await session.commit()
        return child


async def _set_all_children_paid(account_id: uuid.UUID) -> None:
    async with TestingSessionLocal() as session:
        rows = await session.execute(select(Child).where(Child.account_id == account_id))
        for c in rows.scalars().all():
            c.pce_status = "paid"
        await session.commit()


async def _create_partner_user(*, voucher_balance: int = 5) -> tuple[User, Partner, str]:
    """Cria um usuário fotógrafo + Partner ativo e retorna (user, partner, senha em claro)."""

    password = "pro123"
    async with TestingSessionLocal() as session:
        account = Account(name="Studio Pro", slug=f"studio-pro-{uuid.uuid4().hex[:8]}")
        session.add(account)
        await session.flush()

        user = User(
            id=uuid.uuid4(),
            account_id=account.id,
            email=f"pro-{uuid.uuid4().hex[:8]}@example.com",
            password_hash=hash_password(password),
            name="Pro",
            locale="pt-BR",
            role="photographer",
        )
        session.add(user)
        await session.flush()

        partner = Partner(
            id=uuid.uuid4(),
            user_id=user.id,
            name="Pro",
            email=user.email,
            slug=f"pro-{uuid.uuid4().hex[:8]}",
            company_name="Studio Pro",
            status="active",
            voucher_balance=voucher_balance,
        )
        session.add(partner)
        await session.commit()
        return user, partner, password


async def _fetch_partner(partner_id: uuid.UUID) -> Partner:
    async with TestingSessionLocal() as session:
        p = await session.get(Partner, partner_id)
        assert p is not None
        return p


async def _count_partner_ledger(partner_id: uuid.UUID) -> int:
    async with TestingSessionLocal() as session:
        n = await session.scalar(
            select(func.count()).select_from(PartnerLedger).where(PartnerLedger.partner_id == partner_id)
        )
        return int(n or 0)


async def _set_delivery_files(delivery_id: uuid.UUID, *, direct_import: bool = True, files: int = 1) -> None:
    async with TestingSessionLocal() as session:
        delivery = await session.get(Delivery, delivery_id)
        assert delivery is not None
        payload = delivery.assets_payload or {}
        payload["direct_import"] = bool(direct_import)
        payload.setdefault("files", [])
        payload["files"] = [
            {
                "upload_id": f"u{idx}",
                "key": f"partners/p/{delivery_id}/photos/{idx}.jpg",
                "original_filename": f"{idx}.jpg",
                "content_type": "image/jpeg",
                "size_bytes": 123,
                "uploaded_at": datetime.utcnow().isoformat(),
            }
            for idx in range(files)
        ]
        delivery.assets_payload = payload
        await session.commit()


class _FakePartnerStorage:
    def __init__(self, *, files_to_copy: int) -> None:
        self._files_to_copy = files_to_copy

    async def copy_delivery_to_user(
        self,
        *,
        partner_id: str,
        delivery_id: str,
        target_user_id: str,
        target_moment_id: str,
    ) -> list[CopyResult]:
        return [
            CopyResult(
                source_key=f"partners/{partner_id}/{delivery_id}/{i}.jpg",
                dest_key=f"u/{target_user_id}/m/{target_moment_id}/{i}.jpg",
                success=True,
                error=None,
            )
            for i in range(self._files_to_copy)
        ]


def test_partner_check_access_reports_account_and_children_access_by_child() -> None:
    # Cria fotógrafo/partner
    user, _partner, password = asyncio.run(_create_partner_user())
    pro_client = TestClient(app)
    _login(pro_client, email=user.email, password=password)

    # Ana existe no seed (conta existe), mas ainda não tem child
    resp = pro_client.get("/partner/check-access", params={"email": "ana@example.com"})
    assert resp.status_code == 200
    body0 = resp.json()
    assert body0["has_access"] is True
    assert body0["children"] == []

    # Agora cria um child pago para Ana
    ana = asyncio.run(_get_user_by_email("ana@example.com"))
    created = asyncio.run(_create_paid_child_for_account(ana.account_id, name="Bia"))

    resp2 = pro_client.get("/partner/check-access", params={"email": "ana@example.com"})
    assert resp2.status_code == 200
    body = resp2.json()
    assert body["has_access"] is True
    assert any(c["id"] == str(created.id) and c["has_access"] is True for c in body["children"])


def test_partner_check_eligibility_paid_child_only() -> None:
    user, _partner, password = asyncio.run(_create_partner_user())
    pro_client = TestClient(app)
    _login(pro_client, email=user.email, password=password)

    # Ana existe, mas não tem Child pago no seed
    resp0 = pro_client.post("/partner/check-eligibility", json={"email": "ana@example.com"})
    assert resp0.status_code == 200
    body0 = resp0.json()
    assert body0["is_eligible"] is False
    assert body0["reason"] == "NEW_USER"

    # Agora cria Child pago e fica elegível
    ana = asyncio.run(_get_user_by_email("ana@example.com"))
    asyncio.run(_create_paid_child_for_account(ana.account_id, name="Bia"))

    resp1 = pro_client.post("/partner/check-eligibility", json={"email": "ana@example.com"})
    assert resp1.status_code == 200
    body1 = resp1.json()
    assert body1["is_eligible"] is True
    assert body1["reason"] == "EXISTING_ACTIVE_CHILD"


def test_partner_create_delivery_direct_import_does_not_debit() -> None:
    # Cliente (Ana) já tem conta (seed) e precisa ter Child pago para ser elegível (custo 0).
    ana = asyncio.run(_get_user_by_email("ana@example.com"))
    asyncio.run(_create_paid_child_for_account(ana.account_id, name="Bia"))

    user, partner, password = asyncio.run(_create_partner_user(voucher_balance=3))
    pro_client = TestClient(app)
    csrf = _login(pro_client, email=user.email, password=password)

    resp = pro_client.post(
        "/partner/deliveries",
        headers={"X-CSRF-Token": csrf},
        json={
            "client_name": "Ana",
            "target_email": "ana@example.com",
            "child_name": "Bia",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["credit_status"] == "not_required"

    # Não debita créditos
    p = asyncio.run(_fetch_partner(partner.id))
    assert p.voucher_balance == 3
    assert asyncio.run(_count_partner_ledger(partner.id)) == 0

    # Delivery aponta para a conta da Ana
    async def _fetch_delivery() -> Delivery:
        async with TestingSessionLocal() as session:
            d = await session.get(Delivery, uuid.UUID(body["id"]))
            assert d is not None
            return d

    delivery = asyncio.run(_fetch_delivery())
    assert delivery.target_account_id == ana.account_id
    assert delivery.target_email == "ana@example.com"
    assert bool((delivery.assets_payload or {}).get("direct_import")) is True
    assert bool((delivery.assets_payload or {}).get("credit_reserved")) is False


def test_partner_create_delivery_existing_child_requires_target_child_id_for_multi_child() -> None:
    # Ana tem conta (seed). Criamos 2 filhos: 1 pago e 1 sem acesso.
    ana = asyncio.run(_get_user_by_email("ana@example.com"))
    paid = asyncio.run(_create_paid_child_for_account(ana.account_id, name="Bia"))
    unpaid = asyncio.run(_create_unpaid_child_for_account(ana.account_id, name="Cleo"))

    user, partner, password = asyncio.run(_create_partner_user(voucher_balance=3))
    pro_client = TestClient(app)
    csrf = _login(pro_client, email=user.email, password=password)

    # 1) Intenção explícita de EXISTING_CHILD sem target_child_id => 400
    resp0 = pro_client.post(
        "/partner/deliveries",
        headers={"X-CSRF-Token": csrf},
        json={
            "client_name": "Ana",
            "target_email": "ana@example.com",
            "intended_import_action": "EXISTING_CHILD",
        },
    )
    assert resp0.status_code == 400

    # 2) Selecionando o filho pago => custo 0 e vínculo ao child
    resp1 = pro_client.post(
        "/partner/deliveries",
        headers={"X-CSRF-Token": csrf},
        json={
            "client_name": "Ana",
            "target_email": "ana@example.com",
            "intended_import_action": "EXISTING_CHILD",
            "target_child_id": str(paid.id),
        },
    )
    assert resp1.status_code == 201, resp1.text
    body1 = resp1.json()
    assert body1["credit_status"] == "not_required"

    # Não debita créditos
    p = asyncio.run(_fetch_partner(partner.id))
    assert p.voucher_balance == 3
    assert asyncio.run(_count_partner_ledger(partner.id)) == 0

    async def _fetch_delivery(delivery_id: str) -> Delivery:
        async with TestingSessionLocal() as session:
            d = await session.get(Delivery, uuid.UUID(delivery_id))
            assert d is not None
            return d

    d = asyncio.run(_fetch_delivery(body1["id"]))
    assert d.target_child_id == paid.id
    assert (d.assets_payload or {}).get("target_child_id") == str(paid.id)

    # 3) Selecionando o filho sem acesso => 400
    resp2 = pro_client.post(
        "/partner/deliveries",
        headers={"X-CSRF-Token": csrf},
        json={
            "client_name": "Ana",
            "target_email": "ana@example.com",
            "intended_import_action": "EXISTING_CHILD",
            "target_child_id": str(unpaid.id),
        },
    )
    assert resp2.status_code == 400


def test_partner_create_delivery_reserved_debits() -> None:
    user, partner, password = asyncio.run(_create_partner_user(voucher_balance=2))
    pro_client = TestClient(app)
    csrf = _login(pro_client, email=user.email, password=password)

    resp = pro_client.post(
        "/partner/deliveries",
        headers={"X-CSRF-Token": csrf},
        json={
            "client_name": "Novo",
            "target_email": "novo@example.com",
            "child_name": "Bebe",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["credit_status"] == "reserved"

    p = asyncio.run(_fetch_partner(partner.id))
    assert p.voucher_balance == 1
    assert asyncio.run(_count_partner_ledger(partner.id)) == 1


def test_partner_finalize_delivery_direct_import_returns_import_url() -> None:
    # Garante acesso do cliente
    ana = asyncio.run(_get_user_by_email("ana@example.com"))
    asyncio.run(_create_paid_child_for_account(ana.account_id, name="Bia"))

    user, _partner, password = asyncio.run(_create_partner_user(voucher_balance=3))
    pro_client = TestClient(app)
    csrf = _login(pro_client, email=user.email, password=password)

    created = pro_client.post(
        "/partner/deliveries",
        headers={"X-CSRF-Token": csrf},
        json={"client_name": "Ana", "target_email": "ana@example.com", "child_name": "Bia"},
    )
    assert created.status_code == 201
    delivery_id = created.json()["id"]

    asyncio.run(_set_delivery_files(uuid.UUID(delivery_id), files=2))

    fin = pro_client.post(
        f"/partner/deliveries/{delivery_id}/finalize",
        headers={"X-CSRF-Token": csrf},
        json={"beneficiary_name": "Ana", "message": "Suas fotos estão prontas!"},
    )
    assert fin.status_code == 200, fin.text
    body = fin.json()
    assert body["mode"] == "direct_import"
    assert body["voucher_code"] is None
    assert body["redeem_url"] is None
    assert body["import_url"].endswith(f"/jornada/importar-entrega/{delivery_id}")

    async def _fetch_delivery() -> Delivery:
        async with TestingSessionLocal() as session:
            d = await session.get(Delivery, uuid.UUID(delivery_id))
            assert d is not None
            return d

    d = asyncio.run(_fetch_delivery())
    assert d.status == "ready"
    assert d.generated_voucher_code is None


def test_me_pending_deliveries_lists_direct_import(client: TestClient, login: None) -> None:
    ana = asyncio.run(_get_user_by_email("ana@example.com"))

    # Cria partner + delivery direto (sem chamar rotas do portal)
    user, partner, _password = asyncio.run(_create_partner_user(voucher_balance=1))

    async def _seed_delivery() -> uuid.UUID:
        async with TestingSessionLocal() as session:
            d = Delivery(
                id=uuid.uuid4(),
                partner_id=partner.id,
                title="Ensaio de Natal",
                client_name="Ana",
                description=None,
                event_date=None,
                status="ready",
                credit_status="not_required",
                target_email="ana@example.com",
                assets_payload={"direct_import": True, "files": [{"key": "x"}]},
            )
            session.add(d)
            await session.commit()
            return d.id

    delivery_id = asyncio.run(_seed_delivery())

    resp = client.get("/me/deliveries/pending")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    assert any(i["delivery_id"] == str(delivery_id) for i in body["items"])


def test_me_import_delivery_existing_child_is_free(client: TestClient, login: None) -> None:
    ana = asyncio.run(_get_user_by_email("ana@example.com"))

    # Child pago existente
    existing_child = asyncio.run(_create_paid_child_for_account(ana.account_id, name="Bia"))

    user, partner, _password = asyncio.run(_create_partner_user(voucher_balance=2))

    async def _seed_delivery() -> uuid.UUID:
        async with TestingSessionLocal() as session:
            d = Delivery(
                id=uuid.uuid4(),
                partner_id=partner.id,
                title="Entrega",
                client_name="Ana",
                description=None,
                event_date=None,
                status="ready",
                credit_status="not_required",
                target_email="ana@example.com",
                assets_payload={"direct_import": True, "files": [{"key": "a"}, {"key": "b"}]},
            )
            session.add(d)
            await session.commit()
            return d.id

    delivery_id = asyncio.run(_seed_delivery())

    def _override_storage() -> _FakePartnerStorage:
        return _FakePartnerStorage(files_to_copy=2)

    app.dependency_overrides[get_partner_storage] = _override_storage
    try:
        resp = client.post(
            f"/me/deliveries/{delivery_id}/import",
            json={
                "idempotency_key": "k1",
                "action": {"type": "EXISTING_CHILD", "child_id": str(existing_child.id)},
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["assets_transferred"] == 2
        assert body["child_id"] == str(existing_child.id)

        # Não debita créditos do parceiro
        p = asyncio.run(_fetch_partner(partner.id))
        assert p.voucher_balance == 2
        assert asyncio.run(_count_partner_ledger(partner.id)) == 0

        async def _fetch_delivery() -> Delivery:
            async with TestingSessionLocal() as session:
                d = await session.get(Delivery, delivery_id)
                assert d is not None
                return d

        d = asyncio.run(_fetch_delivery())
        assert d.status == "completed"
        assert d.credit_status == "not_required"
        assert d.assets_transferred_at is not None
    finally:
        app.dependency_overrides.pop(get_partner_storage, None)


def test_me_import_delivery_new_child_debits_partner_and_is_idempotent(client: TestClient, login: None) -> None:
    ana = asyncio.run(_get_user_by_email("ana@example.com"))

    user, partner, _password = asyncio.run(_create_partner_user(voucher_balance=1))

    async def _seed_delivery() -> uuid.UUID:
        async with TestingSessionLocal() as session:
            d = Delivery(
                id=uuid.uuid4(),
                partner_id=partner.id,
                title="Entrega",
                client_name="Ana",
                description=None,
                event_date=None,
                status="ready",
                credit_status="not_required",
                target_email="ana@example.com",
                assets_payload={"direct_import": True, "files": [{"key": "a"}]},
            )
            session.add(d)
            await session.commit()
            return d.id

    delivery_id = asyncio.run(_seed_delivery())

    def _override_storage() -> _FakePartnerStorage:
        return _FakePartnerStorage(files_to_copy=1)

    app.dependency_overrides[get_partner_storage] = _override_storage
    try:
        resp = client.post(
            f"/me/deliveries/{delivery_id}/import",
            json={
                "idempotency_key": "k2",
                "action": {"type": "NEW_CHILD", "child_name": "Nina"},
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["assets_transferred"] == 1

        # Debitou parceiro
        p = asyncio.run(_fetch_partner(partner.id))
        assert p.voucher_balance == 0
        assert asyncio.run(_count_partner_ledger(partner.id)) == 1

        # Delivery virou consumed
        async def _fetch_delivery() -> Delivery:
            async with TestingSessionLocal() as session:
                d = await session.get(Delivery, delivery_id)
                assert d is not None
                return d

        d = asyncio.run(_fetch_delivery())
        assert d.credit_status == "consumed"

        # Idempotência: mesma chave não debita de novo e devolve o mesmo resultado
        resp2 = client.post(
            f"/me/deliveries/{delivery_id}/import",
            json={
                "idempotency_key": "k2",
                "action": {"type": "NEW_CHILD", "child_name": "Nina"},
            },
        )
        assert resp2.status_code == 200
        body2 = resp2.json()
        assert body2["moment_id"] == body["moment_id"]
        p2 = asyncio.run(_fetch_partner(partner.id))
        assert p2.voucher_balance == 0
        assert asyncio.run(_count_partner_ledger(partner.id)) == 1
    finally:
        app.dependency_overrides.pop(get_partner_storage, None)


def test_me_import_delivery_email_mismatch_is_forbidden(client: TestClient) -> None:
    # Cria outro usuário para tentar importar uma entrega destinada à Ana
    other_email = "outra@example.com"
    # Evite palavras/padrões que disparem o check de segredos do pre-commit.
    other_password = "change_me"

    async def _seed_other_user() -> None:
        async with TestingSessionLocal() as session:
            account = Account(name="Outra", slug=f"outra-{uuid.uuid4().hex[:8]}")
            session.add(account)
            await session.flush()
            session.add(
                User(
                    id=uuid.uuid4(),
                    account_id=account.id,
                    email=other_email,
                    password_hash=hash_password(other_password),
                    name="Outra",
                    locale="pt-BR",
                    role="owner",
                )
            )
            await session.commit()

    asyncio.run(_seed_other_user())

    _user, partner, _password = asyncio.run(_create_partner_user(voucher_balance=1))

    async def _seed_delivery_for_ana() -> uuid.UUID:
        async with TestingSessionLocal() as session:
            d = Delivery(
                id=uuid.uuid4(),
                partner_id=partner.id,
                title="Entrega",
                client_name="Ana",
                description=None,
                event_date=None,
                status="ready",
                credit_status="not_required",
                target_email="ana@example.com",
                assets_payload={"direct_import": True, "files": [{"key": "a"}]},
            )
            session.add(d)
            await session.commit()
            return d.id

    delivery_id = asyncio.run(_seed_delivery_for_ana())

    # Login com outro e-mail
    csrf = _csrf(client)
    resp_login = client.post(
        "/auth/login",
        json={"email": other_email, "password": other_password, "csrf_token": csrf},
    )
    assert resp_login.status_code == 204

    resp = client.post(
        f"/me/deliveries/{delivery_id}/import",
        json={
            "idempotency_key": "kmismatch",
            "action": {"type": "NEW_CHILD", "child_name": "Nina"},
        },
    )
    assert resp.status_code == 403
    body = resp.json()
    assert body["error"]["code"] == "delivery.email_mismatch"
    assert body["error"].get("details") is not None
    assert body["error"]["details"].get("target_email_masked") == "a***@e***.com"
