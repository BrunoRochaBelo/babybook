"""
Rotas API para Vouchers (B2B2C)

Inclui endpoints para:
- Geração bulk de vouchers por parceiros
- Resgate de vouchers por beneficiários
- Gerenciamento de vouchers
"""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Partner, Voucher, Delivery, Moment
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.vouchers import (
    VoucherCreate,
    VoucherBulkCreate,
    VoucherUpdate,
    VoucherResponse,
    VoucherRedeemRequest,
    VoucherRedeemResponse,
    VoucherBulkResponse,
    PaginatedVouchers,
)
from babybook_api.storage import get_partner_storage, PartnerStorageService

router = APIRouter()


def _generate_voucher_code(prefix: str | None = None) -> str:
    """Gera código de voucher único"""
    random_part = secrets.token_hex(4).upper()
    if prefix:
        return f"{prefix}-{random_part}"
    return f"BB-{random_part}"


def _serialize_voucher(voucher: Voucher) -> VoucherResponse:
    return VoucherResponse(
        id=str(voucher.id),
        partner_id=str(voucher.partner_id),
        code=voucher.code,
        status=voucher.status,
        discount_cents=voucher.discount_cents,
        expires_at=voucher.expires_at,
        uses_limit=voucher.uses_limit,
        uses_count=voucher.uses_count,
        beneficiary_id=str(voucher.beneficiary_id) if voucher.beneficiary_id else None,
        redeemed_at=voucher.redeemed_at,
        delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
        created_at=voucher.created_at,
        updated_at=voucher.updated_at,
    )


async def _get_voucher_or_404(
    db: AsyncSession,
    voucher_id: uuid.UUID,
) -> Voucher:
    stmt = select(Voucher).where(Voucher.id == voucher_id)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()
    if voucher is None:
        raise AppError(status_code=404, code="voucher.not_found", message="Voucher não encontrado.")
    return voucher


async def _get_voucher_by_code(
    db: AsyncSession,
    code: str,
) -> Voucher | None:
    stmt = select(Voucher).where(Voucher.code == code.upper())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


def _require_admin(user: UserSession) -> None:
    """Verifica se o usuário tem role de admin"""
    if user.role not in ("admin", "owner"):
        raise AppError(status_code=403, code="auth.forbidden", message="Acesso negado.")


@router.get(
    "/partners/{partner_id}/vouchers",
    response_model=PaginatedVouchers,
    summary="Lista vouchers de um parceiro",
)
async def list_partner_vouchers(
    partner_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
) -> PaginatedVouchers:
    _require_admin(current_user)

    partner_uuid = uuid.UUID(partner_id)

    # Verificar se partner existe
    partner_check = await db.execute(
        select(Partner.id).where(Partner.id == partner_uuid, Partner.deleted_at.is_(None))
    )
    if not partner_check.scalar_one_or_none():
        raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")

    # Count total
    count_stmt = select(func.count(Voucher.id)).where(Voucher.partner_id == partner_uuid)
    if status_filter:
        count_stmt = count_stmt.where(Voucher.status == status_filter)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Fetch items
    stmt = (
        select(Voucher)
        .where(Voucher.partner_id == partner_uuid)
        .order_by(Voucher.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Voucher.status == status_filter)

    result = await db.execute(stmt)
    items = [_serialize_voucher(v) for v in result.scalars().all()]

    next_cursor = None
    if offset + limit < total:
        next_cursor = str(offset + limit)

    return PaginatedVouchers(items=items, total=total, next=next_cursor)


@router.post(
    "/partners/{partner_id}/vouchers",
    response_model=VoucherBulkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gera vouchers em bulk para um parceiro",
)
async def create_bulk_vouchers(
    partner_id: str,
    body: VoucherBulkCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> VoucherBulkResponse:
    _require_admin(current_user)

    partner_uuid = uuid.UUID(partner_id)

    # Verificar se partner existe
    partner_check = await db.execute(
        select(Partner.id).where(Partner.id == partner_uuid, Partner.deleted_at.is_(None))
    )
    if not partner_check.scalar_one_or_none():
        raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")

    # Verificar se delivery existe (se fornecido)
    delivery_uuid = None
    if body.delivery_id:
        delivery_uuid = uuid.UUID(body.delivery_id)
        delivery_check = await db.execute(
            select(Delivery.id).where(
                Delivery.id == delivery_uuid,
                Delivery.partner_id == partner_uuid,
            )
        )
        if not delivery_check.scalar_one_or_none():
            raise AppError(status_code=404, code="delivery.not_found", message="Delivery não encontrada.")

    # Gerar vouchers
    vouchers = []
    for _ in range(body.count):
        # Gerar código único
        max_attempts = 10
        for attempt in range(max_attempts):
            code = _generate_voucher_code(body.prefix)
            existing = await _get_voucher_by_code(db, code)
            if not existing:
                break
            if attempt == max_attempts - 1:
                raise AppError(
                    status_code=500,
                    code="voucher.generation_failed",
                    message="Falha ao gerar código único de voucher.",
                )

        voucher = Voucher(
            partner_id=partner_uuid,
            code=code,
            discount_cents=body.discount_cents,
            expires_at=body.expires_at,
            uses_limit=body.uses_limit,
            delivery_id=delivery_uuid,
            status="available",
        )
        db.add(voucher)
        vouchers.append(voucher)

    await db.commit()

    # Refresh all vouchers
    for voucher in vouchers:
        await db.refresh(voucher)

    return VoucherBulkResponse(
        created_count=len(vouchers),
        vouchers=[_serialize_voucher(v) for v in vouchers],
    )


@router.post(
    "/vouchers/redeem",
    response_model=VoucherRedeemResponse,
    summary="Resgata um voucher",
)
async def redeem_voucher(
    body: VoucherRedeemRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    storage: PartnerStorageService = Depends(get_partner_storage),
) -> VoucherRedeemResponse:
    """
    Resgata um voucher para a conta do usuário autenticado.
    O voucher será marcado como resgatado e associado à conta.
    
    Se o voucher tem uma entrega associada, os arquivos são copiados
    via server-side copy de partners/{partner_id}/{delivery_id}/ para
    u/{user_id}/m/{moment_id}/.
    """
    voucher = await _get_voucher_by_code(db, body.code)

    if not voucher:
        raise AppError(status_code=404, code="voucher.not_found", message="Voucher não encontrado.")

    # Validações
    if voucher.status != "available":
        raise AppError(
            status_code=400,
            code="voucher.not_available",
            message=f"Voucher não está disponível. Status atual: {voucher.status}",
        )

    if voucher.expires_at and voucher.expires_at < datetime.utcnow():
        voucher.status = "expired"
        await db.commit()
        raise AppError(status_code=400, code="voucher.expired", message="Voucher expirado.")

    if voucher.uses_count >= voucher.uses_limit:
        raise AppError(status_code=400, code="voucher.uses_exceeded", message="Limite de usos do voucher excedido.")

    # Resgatar voucher
    account_id = uuid.UUID(current_user.account_id)
    voucher.beneficiary_id = account_id
    voucher.uses_count += 1
    voucher.redeemed_at = datetime.utcnow()

    if voucher.uses_count >= voucher.uses_limit:
        voucher.status = "redeemed"

    # Se tem entrega associada, copiar arquivos para o usuário
    moment_id: str | None = None
    if voucher.delivery_id:
        # Buscar delivery com partner
        delivery_result = await db.execute(
            select(Delivery)
            .options(selectinload(Delivery.partner))
            .where(Delivery.id == voucher.delivery_id)
        )
        delivery = delivery_result.scalar_one_or_none()
        
        if delivery and delivery.partner:
            # Criar momento para o usuário
            new_moment = Moment(
                id=uuid.uuid4(),
                account_id=account_id,
                title=delivery.title or f"Fotos de {delivery.client_name}",
                description=delivery.description,
                event_date=delivery.event_date,
            )
            db.add(new_moment)
            moment_id = str(new_moment.id)
            
            # Copiar arquivos via server-side copy (B2 b2_copy_file)
            # Isso é instantâneo e não consome banda
            await storage.copy_delivery_to_user(
                partner_id=str(delivery.partner_id),
                delivery_id=str(delivery.id),
                target_user_id=str(account_id),
                target_moment_id=moment_id,
            )
            
            # Atualizar delivery como entregue
            delivery.status = "delivered"
            delivery.assets_transferred_at = datetime.utcnow()
            delivery.beneficiary_email = current_user.email

    await db.commit()

    message = "Voucher resgatado com sucesso!"
    if voucher.discount_cents > 0:
        message += f" Você recebeu um desconto de R${voucher.discount_cents / 100:.2f}."
    if voucher.delivery_id:
        message += " Suas fotos foram importadas para sua galeria!"

    return VoucherRedeemResponse(
        voucher_id=str(voucher.id),
        discount_cents=voucher.discount_cents,
        delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
        moment_id=moment_id,
        message=message,
    )


@router.get(
    "/vouchers/{voucher_id}",
    response_model=VoucherResponse,
    summary="Obtém detalhes de um voucher",
)
async def get_voucher(
    voucher_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> VoucherResponse:
    _require_admin(current_user)
    voucher = await _get_voucher_or_404(db, uuid.UUID(voucher_id))
    return _serialize_voucher(voucher)


@router.patch(
    "/vouchers/{voucher_id}",
    response_model=VoucherResponse,
    summary="Atualiza um voucher",
)
async def update_voucher(
    voucher_id: str,
    body: VoucherUpdate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> VoucherResponse:
    _require_admin(current_user)

    voucher = await _get_voucher_or_404(db, uuid.UUID(voucher_id))

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(voucher, key, value)

    await db.commit()
    await db.refresh(voucher)

    return _serialize_voucher(voucher)


@router.delete(
    "/vouchers/{voucher_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoga um voucher",
)
async def revoke_voucher(
    voucher_id: str,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    _require_admin(current_user)

    voucher = await _get_voucher_or_404(db, uuid.UUID(voucher_id))

    if voucher.status == "redeemed":
        raise AppError(
            status_code=400,
            code="voucher.already_redeemed",
            message="Não é possível revogar um voucher já resgatado.",
        )

    voucher.status = "revoked"
    await db.commit()
