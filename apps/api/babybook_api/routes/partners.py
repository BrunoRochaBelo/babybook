"""
Rotas API para Partners (B2B2C)

Estas rotas são destinadas para administradores gerenciarem parceiros
que podem comprar vouchers em bulk e criar deliveries.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Delivery, Partner, Voucher
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.partners import (
    PaginatedPartners,
    PartnerCreate,
    PartnerDetailResponse,
    PartnerResponse,
    PartnerUpdate,
)

router = APIRouter()


def _serialize_partner(partner: Partner) -> PartnerResponse:
    return PartnerResponse(
        id=str(partner.id),
        name=partner.name,
        slug=partner.slug,
        email=partner.email,
        phone=partner.phone,
        company_name=partner.company_name,
        cnpj=partner.cnpj,
        status=partner.status,
        contact_name=partner.contact_name,
        notes=partner.notes,
        created_at=partner.created_at,
        updated_at=partner.updated_at,
    )


async def _get_partner_or_404(
    db: AsyncSession,
    partner_id: uuid.UUID,
) -> Partner:
    stmt = (
        select(Partner)
        .where(
            Partner.id == partner_id,
            Partner.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    partner = result.scalar_one_or_none()
    if partner is None:
        raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")
    return partner


def _require_admin(user: UserSession) -> None:
    """Verifica se o usuário tem role de admin"""
    if user.role not in ("admin", "owner"):
        raise AppError(status_code=403, code="auth.forbidden", message="Acesso negado. Requer permissão de administrador.")


@router.get(
    "",
    response_model=PaginatedPartners,
    summary="Lista parceiros",
)
async def list_partners(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
) -> PaginatedPartners:
    _require_admin(current_user)

    # Count total
    count_stmt = select(func.count(Partner.id)).where(Partner.deleted_at.is_(None))
    if status_filter:
        count_stmt = count_stmt.where(Partner.status == status_filter)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Fetch items
    stmt = (
        select(Partner)
        .where(Partner.deleted_at.is_(None))
        .order_by(Partner.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Partner.status == status_filter)

    result = await db.execute(stmt)
    items = [_serialize_partner(p) for p in result.scalars().all()]

    next_cursor = None
    if offset + limit < total:
        next_cursor = str(offset + limit)

    return PaginatedPartners(items=items, total=total, next=next_cursor)


@router.post(
    "",
    response_model=PartnerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria novo parceiro",
)
async def create_partner(
    body: PartnerCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PartnerResponse:
    _require_admin(current_user)

    # Verificar se slug já existe
    existing_slug = await db.execute(
        select(Partner.id).where(Partner.slug == body.slug)
    )
    if existing_slug.scalar_one_or_none():
        raise AppError(status_code=409, code="partner.slug_exists", message="Slug já está em uso.")

    # Verificar se email já existe
    existing_email = await db.execute(
        select(Partner.id).where(Partner.email == body.email)
    )
    if existing_email.scalar_one_or_none():
        raise AppError(status_code=409, code="partner.email_exists", message="Email já está em uso.")

    partner = Partner(
        name=body.name,
        slug=body.slug,
        email=body.email,
        phone=body.phone,
        company_name=body.company_name,
        cnpj=body.cnpj,
        contact_name=body.contact_name,
        notes=body.notes,
        status="active",
    )
    db.add(partner)
    await db.commit()
    await db.refresh(partner)

    return _serialize_partner(partner)


@router.get(
    "/{partner_id}",
    response_model=PartnerDetailResponse,
    summary="Obtém detalhes de um parceiro",
)
async def get_partner(
    partner_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PartnerDetailResponse:
    _require_admin(current_user)

    partner = await _get_partner_or_404(db, uuid.UUID(partner_id))

    # Contar vouchers e deliveries
    vouchers_count_result = await db.execute(
        select(func.count(Voucher.id)).where(Voucher.partner_id == partner.id)
    )
    vouchers_count = vouchers_count_result.scalar_one()

    redeemed_count_result = await db.execute(
        select(func.count(Voucher.id)).where(
            Voucher.partner_id == partner.id,
            Voucher.status == "redeemed",
        )
    )
    redeemed_count = redeemed_count_result.scalar_one()

    deliveries_count_result = await db.execute(
        select(func.count(Delivery.id)).where(Delivery.partner_id == partner.id)
    )
    deliveries_count = deliveries_count_result.scalar_one()

    return PartnerDetailResponse(
        id=str(partner.id),
        name=partner.name,
        slug=partner.slug,
        email=partner.email,
        phone=partner.phone,
        company_name=partner.company_name,
        cnpj=partner.cnpj,
        status=partner.status,
        contact_name=partner.contact_name,
        notes=partner.notes,
        created_at=partner.created_at,
        updated_at=partner.updated_at,
        vouchers_count=vouchers_count,
        deliveries_count=deliveries_count,
        redeemed_vouchers_count=redeemed_count,
    )


@router.patch(
    "/{partner_id}",
    response_model=PartnerResponse,
    summary="Atualiza um parceiro",
)
async def update_partner(
    partner_id: str,
    body: PartnerUpdate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PartnerResponse:
    _require_admin(current_user)

    partner = await _get_partner_or_404(db, uuid.UUID(partner_id))

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(partner, key, value)

    await db.commit()
    await db.refresh(partner)

    return _serialize_partner(partner)


@router.delete(
    "/{partner_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove um parceiro (soft delete)",
)
async def delete_partner(
    partner_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    _require_admin(current_user)

    partner = await _get_partner_or_404(db, uuid.UUID(partner_id))

    from datetime import datetime
    partner.deleted_at = datetime.utcnow()
    await db.commit()
