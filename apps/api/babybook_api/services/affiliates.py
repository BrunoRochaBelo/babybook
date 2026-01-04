from __future__ import annotations

import secrets
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import (
    Affiliate,
    AffiliatePayout,
    AffiliateProgramConfig,
    AffiliateSale,
)
from babybook_api.time import utcnow


def _random_order_id() -> str:
    return f"order_{secrets.token_hex(6)}"


async def get_or_create_program_config(db: AsyncSession) -> AffiliateProgramConfig:
    result = await db.execute(select(AffiliateProgramConfig).where(AffiliateProgramConfig.id == 1))
    cfg = result.scalar_one_or_none()
    if cfg:
        return cfg

    cfg = AffiliateProgramConfig(
        id=1,
        default_commission_rate=0.15,
        minimum_payout_cents=50_00,
    )
    db.add(cfg)
    await db.flush()
    return cfg


async def compute_affiliate_balance_cents(db: AsyncSession, affiliate_id: UUID) -> int:
    # commission approved
    commission_approved = await db.scalar(
        select(func.coalesce(func.sum(AffiliateSale.commission_cents), 0))
        .where(AffiliateSale.affiliate_id == affiliate_id)
        .where(AffiliateSale.status == "approved")
    )

    payouts_paid = await db.scalar(
        select(func.coalesce(func.sum(AffiliatePayout.amount_cents), 0))
        .where(AffiliatePayout.affiliate_id == affiliate_id)
        .where(AffiliatePayout.status == "paid")
    )

    payouts_requested = await db.scalar(
        select(func.coalesce(func.sum(AffiliatePayout.amount_cents), 0))
        .where(AffiliatePayout.affiliate_id == affiliate_id)
        .where(AffiliatePayout.status == "requested")
    )

    balance = int(commission_approved or 0) - int(payouts_paid or 0) - int(payouts_requested or 0)
    return max(0, balance)


def serialize_affiliate(a: Affiliate) -> dict[str, Any]:
    return {
        "id": str(a.id),
        "code": a.code,
        "name": a.name,
        "email": a.email,
        "status": a.status,
        "commission_rate": float(a.commission_rate or 0),
        "created_at": a.created_at.isoformat(),
        "updated_at": a.updated_at.isoformat(),
        "payout_method": a.payout_method or None,
    }


def serialize_sale(s: AffiliateSale) -> dict[str, Any]:
    return {
        "id": str(s.id),
        "affiliate_id": str(s.affiliate_id),
        "order_id": s.order_id,
        "occurred_at": s.occurred_at.isoformat(),
        "amount_cents": int(s.amount_cents),
        "commission_cents": int(s.commission_cents),
        "status": s.status,
    }


def serialize_payout(p: AffiliatePayout) -> dict[str, Any]:
    return {
        "id": str(p.id),
        "affiliate_id": str(p.affiliate_id),
        "amount_cents": int(p.amount_cents),
        "status": p.status,
        "requested_at": p.requested_at.isoformat(),
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        "note": p.note or None,
    }


def serialize_program_config(cfg: AffiliateProgramConfig) -> dict[str, Any]:
    return {
        "default_commission_rate": float(cfg.default_commission_rate),
        "minimum_payout_cents": int(cfg.minimum_payout_cents),
    }


def normalize_commission_rate(value: Any, *, default: float) -> float:
    try:
        if value is None:
            return default
        rate = float(value)
        if not (rate == rate):  # NaN
            return default
        return min(1.0, max(0.0, rate))
    except Exception:
        return default


def now_occurrence(occurred_at: str | None) -> datetime:
    if occurred_at:
        try:
            parsed = datetime.fromisoformat(occurred_at.replace("Z", "+00:00"))
            return parsed
        except Exception:
            pass
    return utcnow()


def normalize_order_id(order_id: str | None) -> str:
    if isinstance(order_id, str):
        oid = order_id.strip()
        if oid:
            return oid
    return _random_order_id()
