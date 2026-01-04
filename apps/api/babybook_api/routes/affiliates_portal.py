from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Affiliate, AffiliatePayout, AffiliateSale
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.services.affiliates import (
    compute_affiliate_balance_cents,
    get_or_create_program_config,
    serialize_affiliate,
    serialize_payout,
    serialize_program_config,
    serialize_sale,
)
from babybook_api.time import utcnow

router = APIRouter()


def _require_affiliate(user: UserSession) -> None:
    if user.role != "affiliate":
        raise AppError(status_code=403, code="auth.forbidden", message="Acesso negado.")


async def _get_current_affiliate(db: AsyncSession, user: UserSession) -> Affiliate:
    result = await db.execute(select(Affiliate).where(Affiliate.user_id == UUID(user.id)))
    affiliate = result.scalar_one_or_none()
    if not affiliate:
        # fallback: alguns seeds podem não setar user_id ainda
        result2 = await db.execute(select(Affiliate).where(Affiliate.email == user.email.lower()))
        affiliate = result2.scalar_one_or_none()
    if not affiliate:
        raise AppError(status_code=404, code="affiliate.not_found", message="Afiliado não encontrado")
    return affiliate


class UpdateMeRequest(BaseModel):
    payout_method: dict[str, Any] | None = None


@router.get("/me")
async def get_me(
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_affiliate(user)

    affiliate = await _get_current_affiliate(db, user)

    sales = (
        await db.execute(
            select(AffiliateSale)
            .where(AffiliateSale.affiliate_id == affiliate.id)
            .order_by(AffiliateSale.occurred_at.desc())
        )
    ).scalars().all()

    payouts = (
        await db.execute(
            select(AffiliatePayout)
            .where(AffiliatePayout.affiliate_id == affiliate.id)
            .order_by(AffiliatePayout.requested_at.desc())
        )
    ).scalars().all()

    cfg = await get_or_create_program_config(db)
    balance = await compute_affiliate_balance_cents(db, affiliate.id)

    return {
        "affiliate": serialize_affiliate(affiliate),
        "sales": [serialize_sale(s) for s in sales],
        "payouts": [serialize_payout(p) for p in payouts],
        "program": serialize_program_config(cfg),
        "balance_cents": balance,
    }


@router.patch("/me")
async def patch_me(
    payload: UpdateMeRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_affiliate(user)

    affiliate = await _get_current_affiliate(db, user)
    if payload.payout_method is not None:
        # guardrail mínimo: só aceitamos chaves conhecidas.
        pix_key = None
        if isinstance(payload.payout_method, dict):
            pm = payload.payout_method
            pix_key = pm.get("pix_key")
            if pix_key is not None and not isinstance(pix_key, str):
                pix_key = None
        affiliate.payout_method = {
            "pix_key": (pix_key.strip() if isinstance(pix_key, str) else None),
            "bank_account": None,
        }

    await db.commit()
    await db.refresh(affiliate)

    # Retornamos o mesmo formato do GET /me para simplificar o frontend.
    cfg = await get_or_create_program_config(db)
    balance = await compute_affiliate_balance_cents(db, affiliate.id)

    sales = (
        await db.execute(
            select(AffiliateSale)
            .where(AffiliateSale.affiliate_id == affiliate.id)
            .order_by(AffiliateSale.occurred_at.desc())
        )
    ).scalars().all()

    payouts = (
        await db.execute(
            select(AffiliatePayout)
            .where(AffiliatePayout.affiliate_id == affiliate.id)
            .order_by(AffiliatePayout.requested_at.desc())
        )
    ).scalars().all()

    return {
        "affiliate": serialize_affiliate(affiliate),
        "sales": [serialize_sale(s) for s in sales],
        "payouts": [serialize_payout(p) for p in payouts],
        "program": serialize_program_config(cfg),
        "balance_cents": balance,
    }


@router.post("/payouts/request", status_code=status.HTTP_201_CREATED)
async def request_payout(
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_affiliate(user)

    affiliate = await _get_current_affiliate(db, user)
    cfg = await get_or_create_program_config(db)
    balance = await compute_affiliate_balance_cents(db, affiliate.id)

    if balance < int(cfg.minimum_payout_cents):
        raise AppError(
            status_code=400,
            code="payout.insufficient_balance",
            message="Saldo insuficiente para solicitar pagamento",
        )

    payout = AffiliatePayout(
        id=uuid4(),
        affiliate_id=affiliate.id,
        amount_cents=balance,
        status="requested",
        requested_at=utcnow(),
        paid_at=None,
        note=None,
    )
    db.add(payout)
    await db.commit()
    await db.refresh(payout)

    return serialize_payout(payout)
