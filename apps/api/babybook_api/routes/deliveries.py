"""
Rotas API para Deliveries (B2B2C)

Endpoints para gerenciar entregas de conteúdo de parceiros para beneficiários.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user, require_csrf_token
from babybook_api.db.models import Asset, Delivery, DeliveryAsset, Partner, Voucher
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.request_ip import get_client_ip
from babybook_api.schemas.deliveries import (
    DeliveryAddAssets,
    DeliveryAssetResponse,
    DeliveryCreate,
    DeliveryDetailResponse,
    DeliveryResponse,
    DeliveryUpdate,
    PaginatedDeliveries,
)

router = APIRouter()


def _serialize_delivery(delivery: Delivery) -> DeliveryResponse:
    return DeliveryResponse(
        id=str(delivery.id),
        partner_id=str(delivery.partner_id),
        title=delivery.title,
        description=delivery.description,
        status=delivery.status,
        beneficiary_email=delivery.beneficiary_email,
        beneficiary_name=delivery.beneficiary_name,
        beneficiary_phone=delivery.beneficiary_phone,
        target_account_id=str(delivery.target_account_id) if delivery.target_account_id else None,
        assets_transferred_at=delivery.assets_transferred_at,
        completed_at=delivery.completed_at,
        created_at=delivery.created_at,
        updated_at=delivery.updated_at,
    )


def _serialize_delivery_asset(da: DeliveryAsset) -> DeliveryAssetResponse:
    return DeliveryAssetResponse(
        id=str(da.id),
        delivery_id=str(da.delivery_id),
        asset_id=str(da.asset_id),
        position=da.position,
        transferred_at=da.transferred_at,
        target_asset_id=str(da.target_asset_id) if da.target_asset_id else None,
        created_at=da.created_at,
        updated_at=da.updated_at,
    )


async def _get_delivery_or_404(
    db: AsyncSession,
    delivery_id: uuid.UUID,
    partner_id: uuid.UUID | None = None,
) -> Delivery:
    stmt = select(Delivery).where(Delivery.id == delivery_id)
    if partner_id:
        stmt = stmt.where(Delivery.partner_id == partner_id)
    result = await db.execute(stmt)
    delivery = result.scalar_one_or_none()
    if delivery is None:
        raise AppError(status_code=404, code="delivery.not_found", message="Delivery não encontrada.")
    return delivery


def _require_admin(user: UserSession) -> None:
    """Verifica se o usuário tem role de admin"""
    if user.role not in ("admin", "owner"):
        raise AppError(status_code=403, code="auth.forbidden", message="Acesso negado.")


@router.get(
    "/partners/{partner_id}/deliveries",
    response_model=PaginatedDeliveries,
    summary="Lista deliveries de um parceiro",
)
async def list_partner_deliveries(
    partner_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
) -> PaginatedDeliveries:
    _require_admin(current_user)

    partner_uuid = uuid.UUID(partner_id)

    # Verificar se partner existe
    partner_check = await db.execute(
        select(Partner.id).where(Partner.id == partner_uuid, Partner.deleted_at.is_(None))
    )
    if not partner_check.scalar_one_or_none():
        raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")

    # Count total
    count_stmt = select(func.count(Delivery.id)).where(Delivery.partner_id == partner_uuid)
    if status_filter:
        count_stmt = count_stmt.where(Delivery.status == status_filter)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Fetch items
    stmt = (
        select(Delivery)
        .where(Delivery.partner_id == partner_uuid)
        .order_by(Delivery.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Delivery.status == status_filter)

    result = await db.execute(stmt)
    items = [_serialize_delivery(d) for d in result.scalars().all()]

    next_cursor = None
    if offset + limit < total:
        next_cursor = str(offset + limit)

    return PaginatedDeliveries(items=items, total=total, next=next_cursor)


@router.post(
    "/partners/{partner_id}/deliveries",
    response_model=DeliveryDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma nova delivery para um parceiro",
)
async def create_delivery(
    partner_id: str,
    body: DeliveryCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> DeliveryDetailResponse:
    await enforce_rate_limit(bucket="deliveries:create:admin", limit="20/minute", identity=current_user.id)
    _require_admin(current_user)

    partner_uuid = uuid.UUID(partner_id)

    # Verificar se partner existe
    partner_check = await db.execute(
        select(Partner.id).where(Partner.id == partner_uuid, Partner.deleted_at.is_(None))
    )
    if not partner_check.scalar_one_or_none():
        raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")

    # Criar delivery
    delivery = Delivery(
        partner_id=partner_uuid,
        title=body.title,
        description=body.description,
        beneficiary_email=body.beneficiary_email,
        beneficiary_name=body.beneficiary_name,
        beneficiary_phone=body.beneficiary_phone,
        status="pending",
    )
    db.add(delivery)
    await db.flush()

    # Adicionar assets se fornecidos
    delivery_assets = []
    for position, asset_id_str in enumerate(body.asset_ids):
        asset_id = uuid.UUID(asset_id_str)
        # Verificar se asset existe
        asset_check = await db.execute(select(Asset.id).where(Asset.id == asset_id))
        if not asset_check.scalar_one_or_none():
            raise AppError(
                status_code=400,
                code="asset.not_found",
                message=f"Asset {asset_id_str} não encontrado.",
            )

        da = DeliveryAsset(
            delivery_id=delivery.id,
            asset_id=asset_id,
            position=position,
        )
        db.add(da)
        delivery_assets.append(da)

    # Associar voucher se fornecido
    voucher_code = None
    if body.voucher_code:
        voucher = await db.execute(
            select(Voucher).where(
                Voucher.code == body.voucher_code.upper(),
                Voucher.partner_id == partner_uuid,
            )
        )
        voucher_obj = voucher.scalar_one_or_none()
        if not voucher_obj:
            raise AppError(status_code=404, code="voucher.not_found", message="Voucher não encontrado.")
        voucher_obj.delivery_id = delivery.id
        voucher_code = voucher_obj.code

    await db.commit()
    await db.refresh(delivery)

    return DeliveryDetailResponse(
        id=str(delivery.id),
        partner_id=str(delivery.partner_id),
        title=delivery.title,
        description=delivery.description,
        status=delivery.status,
        beneficiary_email=delivery.beneficiary_email,
        beneficiary_name=delivery.beneficiary_name,
        beneficiary_phone=delivery.beneficiary_phone,
        target_account_id=None,
        assets_transferred_at=None,
        completed_at=None,
        created_at=delivery.created_at,
        updated_at=delivery.updated_at,
        assets=[_serialize_delivery_asset(da) for da in delivery_assets],
        voucher_code=voucher_code,
    )


@router.get(
    "/deliveries/{delivery_id}",
    response_model=DeliveryDetailResponse,
    summary="Obtém detalhes de uma delivery",
)
async def get_delivery(
    delivery_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DeliveryDetailResponse:
    _require_admin(current_user)

    stmt = (
        select(Delivery)
        .where(Delivery.id == uuid.UUID(delivery_id))
        .options(selectinload(Delivery.assets))
    )
    result = await db.execute(stmt)
    delivery = result.scalar_one_or_none()

    if not delivery:
        raise AppError(status_code=404, code="delivery.not_found", message="Delivery não encontrada.")

    # Buscar voucher associado
    voucher_result = await db.execute(
        select(Voucher.code).where(Voucher.delivery_id == delivery.id)
    )
    voucher_code = voucher_result.scalar_one_or_none()

    return DeliveryDetailResponse(
        id=str(delivery.id),
        partner_id=str(delivery.partner_id),
        title=delivery.title,
        description=delivery.description,
        status=delivery.status,
        beneficiary_email=delivery.beneficiary_email,
        beneficiary_name=delivery.beneficiary_name,
        beneficiary_phone=delivery.beneficiary_phone,
        target_account_id=str(delivery.target_account_id) if delivery.target_account_id else None,
        assets_transferred_at=delivery.assets_transferred_at,
        completed_at=delivery.completed_at,
        created_at=delivery.created_at,
        updated_at=delivery.updated_at,
        assets=[_serialize_delivery_asset(da) for da in delivery.assets],
        voucher_code=voucher_code,
    )


@router.patch(
    "/deliveries/{delivery_id}",
    response_model=DeliveryResponse,
    summary="Atualiza uma delivery",
)
async def update_delivery(
    delivery_id: str,
    body: DeliveryUpdate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> DeliveryResponse:
    await enforce_rate_limit(bucket="deliveries:update:admin", limit="60/minute", identity=current_user.id)
    _require_admin(current_user)

    delivery = await _get_delivery_or_404(db, uuid.UUID(delivery_id))

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(delivery, key, value)

    # Se status mudou para completed, registrar timestamp
    if body.status == "completed" and not delivery.completed_at:
        delivery.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(delivery)

    return _serialize_delivery(delivery)


@router.post(
    "/deliveries/{delivery_id}/assets",
    response_model=DeliveryDetailResponse,
    summary="Adiciona assets a uma delivery",
)
async def add_assets_to_delivery(
    delivery_id: str,
    body: DeliveryAddAssets,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> DeliveryDetailResponse:
    await enforce_rate_limit(bucket="deliveries:assets:add:admin", limit="100/minute", identity=current_user.id)
    _require_admin(current_user)

    delivery = await _get_delivery_or_404(db, uuid.UUID(delivery_id))

    if delivery.status not in ("pending", "processing"):
        raise AppError(
            status_code=400,
            code="delivery.cannot_modify",
            message="Não é possível adicionar assets a uma delivery finalizada.",
        )

    # Obter próxima posição
    max_position_result = await db.execute(
        select(func.max(DeliveryAsset.position)).where(DeliveryAsset.delivery_id == delivery.id)
    )
    max_position = max_position_result.scalar_one() or -1

    new_assets = []
    for i, asset_id_str in enumerate(body.asset_ids):
        asset_id = uuid.UUID(asset_id_str)

        # Verificar se asset existe
        asset_check = await db.execute(select(Asset.id).where(Asset.id == asset_id))
        if not asset_check.scalar_one_or_none():
            raise AppError(
                status_code=400,
                code="asset.not_found",
                message=f"Asset {asset_id_str} não encontrado.",
            )

        # Verificar se já não está na delivery
        existing = await db.execute(
            select(DeliveryAsset.id).where(
                DeliveryAsset.delivery_id == delivery.id,
                DeliveryAsset.asset_id == asset_id,
            )
        )
        if existing.scalar_one_or_none():
            continue  # Skip duplicates

        da = DeliveryAsset(
            delivery_id=delivery.id,
            asset_id=asset_id,
            position=max_position + 1 + i,
        )
        db.add(da)
        new_assets.append(da)

    await db.commit()

    # Reload with assets
    return await get_delivery(delivery_id, current_user, db)


@router.delete(
    "/deliveries/{delivery_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove uma delivery",
)
async def delete_delivery(
    delivery_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> None:
    await enforce_rate_limit(bucket="deliveries:delete:admin", limit="30/minute", identity=current_user.id)
    _require_admin(current_user)

    delivery = await _get_delivery_or_404(db, uuid.UUID(delivery_id))

    if delivery.status == "completed":
        raise AppError(
            status_code=400,
            code="delivery.cannot_delete",
            message="Não é possível excluir uma delivery já completada.",
        )

    # Desassociar vouchers
    await db.execute(
        Voucher.__table__.update()
        .where(Voucher.delivery_id == delivery.id)
        .values(delivery_id=None)
    )

    await db.delete(delivery)
    await db.commit()
