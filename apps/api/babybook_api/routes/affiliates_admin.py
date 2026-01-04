from __future__ import annotations

import re
import secrets
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Affiliate, AffiliatePayout, AffiliateSale, User
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.security import hash_password
from babybook_api.services.affiliates import (
    get_or_create_program_config,
    normalize_commission_rate,
    normalize_order_id,
    now_occurrence,
    serialize_affiliate,
    serialize_payout,
    serialize_sale,
)

router = APIRouter()


def _require_company_admin(user: UserSession) -> None:
    if user.role != "company_admin":
        raise AppError(status_code=403, code="auth.forbidden", message="Acesso negado.")


def _slugify_code(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
    base = re.sub(r"-+", "-", base).strip("-")
    base = base or "affiliate"
    return f"{base}-{secrets.token_hex(3)}"


class CreateAffiliateRequest(BaseModel):
    name: str
    email: EmailStr
    commission_rate: float | None = None


class UpdateAffiliateRequest(BaseModel):
    status: Literal["active", "paused"] | None = None
    commission_rate: float | None = None


class RegisterSaleRequest(BaseModel):
    affiliate_id: UUID
    amount_cents: int
    order_id: str | None = None
    occurred_at: str | None = None


@router.get("/affiliates")
async def list_affiliates(
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_company_admin(user)

    result = await db.execute(select(Affiliate).order_by(Affiliate.created_at.desc()))
    affiliates = result.scalars().all()
    return {"items": [serialize_affiliate(a) for a in affiliates]}


@router.post("/affiliates", status_code=status.HTTP_201_CREATED)
async def create_affiliate(
    payload: CreateAffiliateRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_company_admin(user)

    cfg = await get_or_create_program_config(db)
    email = payload.email.strip().lower()

    # Cria também um usuário de portal para o afiliado (senha default de dev).
    # Em produção, a senha deveria ser gerada + enviada por e-mail.
    password_plain = "affiliate123"

    affiliate = Affiliate(
        id=uuid4(),
        code=_slugify_code(payload.name),
        name=payload.name.strip(),
        email=email,
        status="active",
        commission_rate=normalize_commission_rate(payload.commission_rate, default=cfg.default_commission_rate),
        payout_method={"pix_key": None, "bank_account": None},
    )
    db.add(affiliate)

    portal_user = User(
        account_id=UUID(user.account_id),
        email=email,
        password_hash=hash_password(password_plain),
        name=payload.name.strip(),
        locale="pt-BR",
        role="affiliate",
    )
    db.add(portal_user)

    try:
        await db.flush()
    except IntegrityError:
        raise AppError(
            status_code=409,
            code="affiliate.conflict",
            message="E-mail ou código já cadastrado.",
        )

    affiliate.user_id = portal_user.id
    await db.flush()

    await db.commit()
    await db.refresh(affiliate)

    return serialize_affiliate(affiliate)


@router.get("/affiliates/{affiliate_id}")
async def affiliate_detail(
    affiliate_id: UUID,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_company_admin(user)

    result = await db.execute(select(Affiliate).where(Affiliate.id == affiliate_id))
    affiliate = result.scalar_one_or_none()
    if not affiliate:
        raise AppError(status_code=404, code="affiliate.not_found", message="Afiliado não encontrado")

    sales = (
        await db.execute(
            select(AffiliateSale)
            .where(AffiliateSale.affiliate_id == affiliate_id)
            .order_by(AffiliateSale.occurred_at.desc())
        )
    ).scalars().all()

    payouts = (
        await db.execute(
            select(AffiliatePayout)
            .where(AffiliatePayout.affiliate_id == affiliate_id)
            .order_by(AffiliatePayout.requested_at.desc())
        )
    ).scalars().all()

    return {
        "affiliate": serialize_affiliate(affiliate),
        "sales": [serialize_sale(s) for s in sales],
        "payouts": [serialize_payout(p) for p in payouts],
    }


@router.patch("/affiliates/{affiliate_id}")
async def update_affiliate(
    affiliate_id: UUID,
    payload: UpdateAffiliateRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_company_admin(user)

    result = await db.execute(select(Affiliate).where(Affiliate.id == affiliate_id))
    affiliate = result.scalar_one_or_none()
    if not affiliate:
        raise AppError(status_code=404, code="affiliate.not_found", message="Afiliado não encontrado")

    if payload.status is not None:
        affiliate.status = payload.status

    if payload.commission_rate is not None:
        cfg = await get_or_create_program_config(db)
        affiliate.commission_rate = normalize_commission_rate(payload.commission_rate, default=cfg.default_commission_rate)

    await db.commit()
    await db.refresh(affiliate)
    return serialize_affiliate(affiliate)


@router.delete("/affiliates/{affiliate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_affiliate(
    affiliate_id: UUID,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    _require_company_admin(user)

    # Deleta em cascata (sales/payouts) via FK; também remove usuário associado.
    result = await db.execute(select(Affiliate).where(Affiliate.id == affiliate_id))
    affiliate = result.scalar_one_or_none()
    if not affiliate:
        raise AppError(status_code=404, code="affiliate.not_found", message="Afiliado não encontrado")

    if affiliate.user_id:
        await db.execute(delete(User).where(User.id == affiliate.user_id))

    await db.execute(delete(Affiliate).where(Affiliate.id == affiliate_id))
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/sales", status_code=status.HTTP_201_CREATED)
async def register_sale(
    payload: RegisterSaleRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    _require_company_admin(user)

    result = await db.execute(select(Affiliate).where(Affiliate.id == payload.affiliate_id))
    affiliate = result.scalar_one_or_none()
    if not affiliate:
        raise AppError(status_code=404, code="affiliate.not_found", message="Afiliado não encontrado")

    if affiliate.status != "active":
        raise AppError(status_code=400, code="affiliate.paused", message="Afiliado está pausado")

    amount = int(payload.amount_cents)
    if amount <= 0:
        raise AppError(status_code=400, code="sale.invalid_amount", message="Valor inválido")

    order_id = normalize_order_id(payload.order_id)
    occurred_at = now_occurrence(payload.occurred_at)
    commission_cents = max(0, int(round(amount * float(affiliate.commission_rate or 0))))

    sale = AffiliateSale(
        id=uuid4(),
        affiliate_id=affiliate.id,
        order_id=order_id,
        occurred_at=occurred_at,
        amount_cents=amount,
        commission_cents=commission_cents,
        status="approved",
    )
    db.add(sale)
    await db.commit()
    await db.refresh(sale)

    return serialize_sale(sale)
