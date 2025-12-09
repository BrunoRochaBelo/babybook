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
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Child, Partner, Voucher, Delivery, Moment
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
    Resgata um voucher de forma transacional e idempotente.

    - Trava o voucher com SELECT FOR UPDATE
    - Valida status/expiração/limite de uso
    - Cria (ou reusa) uma criança placeholder para associar o momento
    - Copia assets server-side; falha aborta a transação
    - Persiste metadados de idempotência
    """
    account_id = uuid.UUID(current_user.account_id)
    now = datetime.utcnow()

    async with db.begin():
        voucher: Voucher | None = await db.scalar(
            select(Voucher).where(Voucher.code == body.code).with_for_update()
        )

        if not voucher:
            raise AppError(status_code=404, code="voucher.not_found", message="Voucher não encontrado.")

        # Idempotência: se mesma key já usada, retorna resultado anterior
        if body.idempotency_key and voucher.metadata:
            if voucher.metadata.get("idempotency_key") == body.idempotency_key:
                return VoucherRedeemResponse(
                    voucher_id=str(voucher.id),
                    discount_cents=voucher.discount_cents,
                    delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
                    moment_id=voucher.metadata.get("moment_id"),
                    message=voucher.metadata.get("redeem_message", "Voucher já resgatado."),
                )

        if voucher.status != "available":
            raise AppError(
                status_code=400,
                code="voucher.not_available",
                message=f"Voucher não está disponível. Status atual: {voucher.status}",
            )

        if voucher.expires_at and voucher.expires_at < now:
            voucher.status = "expired"
            raise AppError(status_code=400, code="voucher.expired", message="Voucher expirado.")

        if voucher.uses_count >= voucher.uses_limit:
            raise AppError(status_code=400, code="voucher.uses_exceeded", message="Limite de usos do voucher excedido.")

        if voucher.beneficiary_id and voucher.beneficiary_id != account_id:
            raise AppError(status_code=409, code="voucher.already_claimed", message="Voucher já usado por outro usuário.")

        child_id = await _ensure_child_for_account(db, account_id, current_user.name)

        voucher.beneficiary_id = account_id
        voucher.uses_count += 1
        voucher.redeemed_at = now

        if voucher.uses_count >= voucher.uses_limit:
            voucher.status = "redeemed"

        moment_id: str | None = None
        delivery_message = ""

        if voucher.delivery_id:
            delivery: Delivery | None = await db.scalar(
                select(Delivery)
                .options(selectinload(Delivery.partner))
                .where(Delivery.id == voucher.delivery_id)
                .with_for_update()
            )

            if not delivery:
                raise AppError(status_code=404, code="delivery.not_found", message="Entrega não encontrada para este voucher.")

            new_moment = Moment(
                id=uuid.uuid4(),
                account_id=account_id,
                child_id=child_id,
                title=delivery.title or f"Entrega de {delivery.client_name or 'parceiro'}",
                description=delivery.description,
                occurred_at=delivery.event_date,
                status="published",
            )
            db.add(new_moment)
            moment_id = str(new_moment.id)

            copy_results = await storage.copy_delivery_to_user(
                partner_id=str(delivery.partner_id),
                delivery_id=str(delivery.id),
                target_user_id=str(account_id),
                target_moment_id=moment_id,
            )

            if any(not r.success for r in copy_results):
                errors = [r.error for r in copy_results if not r.success and r.error]
                raise AppError(status_code=500, code="delivery.copy_failed", message=f"Falha ao copiar arquivos: {'; '.join(errors)}")

            delivery.status = "completed"
            delivery.assets_transferred_at = now
            delivery.beneficiary_email = current_user.email
            delivery_message = " Suas fotos foram importadas para sua galeria!"

        message = "Voucher resgatado com sucesso!"
        if voucher.discount_cents > 0:
            message += f" Você recebeu um desconto de R${voucher.discount_cents / 100:.2f}."
        message += delivery_message

        meta: dict[str, Any] = voucher.metadata or {}
        if body.idempotency_key:
            meta["idempotency_key"] = body.idempotency_key
        if moment_id:
            meta["moment_id"] = moment_id
        meta["redeem_message"] = message
        voucher.metadata = meta

    return VoucherRedeemResponse(
        voucher_id=str(voucher.id),
        discount_cents=voucher.discount_cents,
        delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
        moment_id=moment_id,
        message=message,
    )


async def _ensure_child_for_account(db: AsyncSession, account_id: uuid.UUID, default_name: str | None) -> uuid.UUID:
    """Recupera ou cria uma criança placeholder para associar momentos do resgate."""
    child = await db.scalar(
        select(Child)
        .where(Child.account_id == account_id)
        .order_by(Child.created_at.asc())
        .limit(1)
        .with_for_update()
    )
    if child:
        return child.id

    new_child = Child(
        id=uuid.uuid4(),
        account_id=account_id,
        name=default_name or "Seu bebê",
    )
    db.add(new_child)
    await db.flush()
    return new_child.id


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
