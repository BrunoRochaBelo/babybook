from __future__ import annotations

import hashlib
import hmac
import json
import uuid

from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import Account, BillingEvent
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.settings import settings

router = APIRouter(prefix="/webhooks")


async def _get_account(db: AsyncSession, account_id: uuid.UUID) -> Account:
    account = await db.get(Account, account_id)
    if account is None:
        raise AppError(status_code=404, code="account.not_found", message="Conta nao encontrada.")
    return account


def _validate_signature(raw_body: bytes, provided: str | None) -> None:
    if not provided:
        raise AppError(status_code=401, code="billing.signature.missing", message="Assinatura obrigatoria.")
    expected = hmac.new(settings.billing_webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, provided):
        raise AppError(status_code=401, code="billing.signature.invalid", message="Assinatura invalida.")


def _apply_entitlement(account: Account, package_key: str) -> None:
    if package_key == "unlimited_social":
        account.unlimited_social = True
    elif package_key == "unlimited_creative":
        account.unlimited_creative = True
    elif package_key == "unlimited_tracking":
        account.unlimited_tracking = True
    else:
        raise AppError(status_code=400, code="billing.package.invalid", message="Pacote desconhecido.")


@router.post("/payment", status_code=status.HTTP_200_OK, summary="Webhook de pagamento")
async def payment_webhook(
    request: Request,
    signature: str | None = Header(default=None, alias="X-Billing-Signature"),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    raw_body = await request.body()
    _validate_signature(raw_body, signature)
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise AppError(status_code=400, code="billing.payload.invalid", message="JSON invalido.") from exc

    event_id = payload.get("id")
    metadata = payload.get("data", {}).get("object", {}).get("metadata", {})
    account_id = metadata.get("account_id")
    package_key = metadata.get("package_key")
    amount = payload.get("data", {}).get("object", {}).get("amount")
    currency = payload.get("data", {}).get("object", {}).get("currency")

    if not event_id or not account_id or not package_key:
        raise AppError(status_code=400, code="billing.payload.missing", message="Campos obrigatorios ausentes.")

    account_uuid = uuid.UUID(account_id)
    stmt = select(BillingEvent).where(BillingEvent.event_id == event_id)
    if (await db.execute(stmt)).scalar_one_or_none():
        return {"status": "ok"}

    account = await _get_account(db, account_uuid)
    _apply_entitlement(account, package_key)

    db.add(
        BillingEvent(
            account_id=account_uuid,
            event_id=event_id,
            package_key=package_key,
            amount=amount,
            currency=currency,
            payload=payload,
        )
    )
    await db.flush()
    await db.commit()
    return {"status": "ok"}
