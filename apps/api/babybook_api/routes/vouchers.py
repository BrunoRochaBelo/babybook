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

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user, get_optional_user
from babybook_api.db.models import Account, Child, Partner, Voucher, Delivery, Moment, PartnerLedger
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.vouchers import (
    VoucherCreate,
    VoucherBulkCreate,
    VoucherUpdate,
    VoucherResponse,
    VoucherValidateRequest,
    VoucherValidationResult,
    VoucherPublic,
    VoucherRedeemRequest,
    VoucherRedeemResponse,
    VoucherBulkResponse,
    PaginatedVouchers,
)
from babybook_api.security import issue_csrf_token
from babybook_api.services.auth import apply_session_cookie, create_session, create_user
from babybook_api.request_ip import get_client_ip
from babybook_api.storage import get_partner_storage, PartnerStorageService

router = APIRouter()


def _assets_count_from_delivery(delivery: Delivery | None) -> int:
    if not delivery or not delivery.assets_payload:
        return 0
    files = delivery.assets_payload.get("files")
    if isinstance(files, list):
        return len(files)
    # fallback: alguns formatos antigos podem usar lista direta
    if isinstance(delivery.assets_payload, list):
        return len(delivery.assets_payload)
    return 0


def _public_voucher_payload(voucher: Voucher, *, partner: Partner | None = None) -> VoucherPublic:
    max_uses = voucher.uses_limit
    uses_left = max(0, max_uses - (voucher.uses_count or 0))
    is_active = voucher.status == "available" and uses_left > 0
    if voucher.expires_at is not None and voucher.expires_at < datetime.utcnow():
        is_active = False
    return VoucherPublic(
        id=str(voucher.id),
        code=voucher.code,
        partner_id=str(voucher.partner_id),
        partner_name=(partner.company_name or partner.name) if partner else None,
        delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
        beneficiary_id=str(voucher.beneficiary_id) if voucher.beneficiary_id else None,
        expires_at=voucher.expires_at,
        uses_left=uses_left,
        max_uses=max_uses,
        is_active=is_active,
        created_at=voucher.created_at,
        redeemed_at=voucher.redeemed_at,
    )


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
    "/vouchers/validate",
    response_model=VoucherValidationResult,
    summary="Valida um voucher sem consumi-lo",
)
async def validate_voucher(
    body: VoucherValidateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> VoucherValidationResult:
    now = datetime.utcnow()
    voucher: Voucher | None = await db.scalar(select(Voucher).where(Voucher.code == body.code.upper()))
    if voucher is None:
        return VoucherValidationResult(
            valid=False,
            voucher=None,
            error_code="voucher.not_found",
            error_message="Voucher não encontrado.",
        )

    partner: Partner | None = await db.get(Partner, voucher.partner_id)
    delivery: Delivery | None = None
    if voucher.delivery_id:
        delivery = await db.get(Delivery, voucher.delivery_id)

    if voucher.status != "available":
        return VoucherValidationResult(
            valid=False,
            voucher=_public_voucher_payload(voucher, partner=partner),
            error_code="voucher.not_available",
            error_message=f"Voucher não está disponível. Status atual: {voucher.status}",
            partner_name=(partner.company_name or partner.name) if partner else None,
            delivery_title=delivery.title if delivery else None,
            assets_count=_assets_count_from_delivery(delivery),
        )

    if voucher.expires_at and voucher.expires_at < now:
        return VoucherValidationResult(
            valid=False,
            voucher=_public_voucher_payload(voucher, partner=partner),
            error_code="voucher.expired",
            error_message="Voucher expirado.",
            partner_name=(partner.company_name or partner.name) if partner else None,
            delivery_title=delivery.title if delivery else None,
            assets_count=_assets_count_from_delivery(delivery),
        )

    if voucher.uses_count >= voucher.uses_limit:
        return VoucherValidationResult(
            valid=False,
            voucher=_public_voucher_payload(voucher, partner=partner),
            error_code="voucher.uses_exceeded",
            error_message="Limite de usos do voucher excedido.",
            partner_name=(partner.company_name or partner.name) if partner else None,
            delivery_title=delivery.title if delivery else None,
            assets_count=_assets_count_from_delivery(delivery),
        )

    return VoucherValidationResult(
        valid=True,
        voucher=_public_voucher_payload(voucher, partner=partner),
        partner_name=(partner.company_name or partner.name) if partner else None,
        delivery_title=delivery.title if delivery else None,
        assets_count=_assets_count_from_delivery(delivery),
    )


@router.get(
    "/vouchers/check/{code}",
    summary="Checa se um voucher está disponível (validação rápida)",
)
async def check_voucher_availability(
    code: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, bool | str | None]:
    result = await validate_voucher(VoucherValidateRequest(code=code), db)
    if result.valid:
        return {"available": True, "reason": None}
    return {"available": False, "reason": result.error_code or "voucher.invalid"}


@router.get(
    "/vouchers/me",
    response_model=list[VoucherPublic],
    summary="Lista vouchers resgatados pelo usuário atual",
)
async def list_my_vouchers(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[VoucherPublic]:
    account_id = uuid.UUID(current_user.account_id)
    rows = await db.execute(
        select(Voucher)
        .where(Voucher.beneficiary_id == account_id)
        .order_by(Voucher.redeemed_at.desc().nullslast(), Voucher.created_at.desc())
        .limit(100)
    )
    vouchers_list = rows.scalars().all()
    # partner_name é opcional; evitamos N+1 aqui por simplicidade (max 100).
    partners_by_id: dict[uuid.UUID, Partner] = {}
    for v in vouchers_list:
        if v.partner_id not in partners_by_id:
            p = await db.get(Partner, v.partner_id)
            if p is not None:
                partners_by_id[v.partner_id] = p
    return [_public_voucher_payload(v, partner=partners_by_id.get(v.partner_id)) for v in vouchers_list]


@router.post(
    "/vouchers/redeem",
    response_model=VoucherRedeemResponse,
    summary="Resgata um voucher",
)
async def redeem_voucher(
    body: VoucherRedeemRequest,
    request: Request,
    response: Response,
    current_user: UserSession | None = Depends(get_optional_user),
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
    csrf_token_for_session: str | None = None

    # Se não há sessão, podemos criar conta+sessão no mesmo fluxo.
    if current_user is None:
        if body.create_account is None:
            raise AppError(status_code=401, code="auth.session.invalid", message="Sessao nao autenticada.")

        # Cria usuário/conta e sessão (cookie) para o onboarding.
        csrf_token_for_session = issue_csrf_token()
        user = await create_user(db, body.create_account.email, body.create_account.password, body.create_account.name)
        session = await create_session(
            db,
            user,
            csrf_token_for_session,
            user_agent=request.headers.get("user-agent"),
            client_ip=get_client_ip(request),
        )
        apply_session_cookie(response, session.token)
        # A partir daqui, tratamos o fluxo como autenticado.
        current_user = UserSession(
            id=str(user.id),
            account_id=str(user.account_id),
            email=user.email,
            name=user.name,
            locale=user.locale,
            role=user.role,
        )

    account_id = uuid.UUID(current_user.account_id)
    now = datetime.utcnow()

    async def _resolve_child_for_action() -> Child:
        # Se action não vier, aplicamos o caminho legado: escolhe/garante um child.
        # Regra conservadora: este caminho passa a ser equivalente a NEW_CHILD (consome reserva)
        # e garante pce_status='paid' para não deixar o livro em estado incoerente.
        if body.action is None:
            child = await _ensure_child_for_account(db, account_id, current_user.name)
            # Garante PCE pago no fluxo de resgate (voucher equivale a compra)
            if child.pce_status != "paid":
                child.pce_status = "paid"
            return child

        if body.action.type == "EXISTING_CHILD":
            try:
                child_uuid = uuid.UUID(body.action.child_id)
            except ValueError as exc:
                raise AppError(status_code=400, code="child.invalid_id", message="child_id inválido.") from exc

            child = await db.scalar(
                select(Child)
                .where(
                    Child.id == child_uuid,
                    Child.account_id == account_id,
                    Child.deleted_at.is_(None),
                )
                .with_for_update()
            )
            if child is None:
                raise AppError(
                    status_code=404,
                    code="child.not_found",
                    message="Child não encontrado (ou sem acesso).",
                )
            # Golden Record: EXISTING_CHILD só é válido se PCE já estiver pago.
            if child.pce_status != "paid":
                raise AppError(
                    status_code=400,
                    code="child.pce.unpaid",
                    message="Este Livro ainda não está com PCE pago. Crie um novo Livro para consumir o voucher.",
                )
            return child

        # NEW_CHILD: cria livro com PCE pago.
        new_child = Child(
            id=uuid.uuid4(),
            account_id=account_id,
            name=(body.action.child_name or "Seu bebê"),
            pce_status="paid",
        )
        db.add(new_child)
        await db.flush()
        return new_child

    async with db.begin():
        voucher: Voucher | None = await db.scalar(
            select(Voucher).where(Voucher.code == body.code).with_for_update()
        )

        if not voucher:
            raise AppError(status_code=404, code="voucher.not_found", message="Voucher não encontrado.")

        # Idempotência: se mesma key já usada, retorna resultado anterior
        if body.idempotency_key and voucher.voucher_metadata:
            if voucher.voucher_metadata.get("idempotency_key") == body.idempotency_key:
                return VoucherRedeemResponse(
                    voucher_id=str(voucher.id),
                    discount_cents=voucher.discount_cents,
                    delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
                    moment_id=voucher.voucher_metadata.get("moment_id"),
                    message=voucher.voucher_metadata.get("redeem_message", "Voucher já resgatado."),
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

        child = await _resolve_child_for_action()
        child_id = child.id

        voucher.beneficiary_id = account_id
        voucher.uses_count += 1
        voucher.redeemed_at = now

        if voucher.uses_count >= voucher.uses_limit:
            voucher.status = "redeemed"

        moment_id: str | None = None
        delivery_message = ""
        assets_transferred = 0

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

            assets_transferred = len([r for r in copy_results if r.success])

            if any(not r.success for r in copy_results):
                errors = [r.error for r in copy_results if not r.success and r.error]
                raise AppError(status_code=500, code="delivery.copy_failed", message=f"Falha ao copiar arquivos: {'; '.join(errors)}")

            # Golden Record: late binding do crédito do parceiro.
            # Observação: aplicamos após a cópia para evitar consumir/estornar crédito
            # em transações que falham.
            # Golden Record: late binding do crédito do parceiro.
            # - action=EXISTING_CHILD => estorno (refund)
            # - action=NEW_CHILD (ou legacy sem action) => consumo (consumed)
            if body.action is not None and body.action.type == "EXISTING_CHILD":
                if delivery.credit_status == "reserved":
                    locked_partner = await db.scalar(
                        select(Partner)
                        .where(Partner.id == delivery.partner_id)
                        .with_for_update()
                    )
                    if locked_partner is None:
                        raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")

                    locked_partner.voucher_balance += 1
                    db.add(
                        PartnerLedger(
                            id=uuid.uuid4(),
                            partner_id=delivery.partner_id,
                            amount=+1,
                            type="refund",
                            description=f"refund delivery={delivery.id} voucher={voucher.code}",
                        )
                    )
                    delivery.credit_status = "refunded"
                elif delivery.credit_status == "consumed":
                    raise AppError(
                        status_code=409,
                        code="delivery.credit_already_consumed",
                        message="Crédito desta entrega já foi consumido.",
                    )
            else:
                # NEW_CHILD ou legado sem action
                if delivery.credit_status == "reserved":
                    delivery.credit_status = "consumed"
                elif delivery.credit_status == "refunded":
                    raise AppError(
                        status_code=409,
                        code="delivery.credit_already_refunded",
                        message="Crédito desta entrega já foi estornado.",
                    )

            delivery.status = "completed"
            delivery.assets_transferred_at = now
            delivery.beneficiary_email = current_user.email
            delivery_message = " Suas fotos foram importadas para sua galeria!"

        message = "Voucher resgatado com sucesso!"
        if voucher.discount_cents > 0:
            message += f" Você recebeu um desconto de R${voucher.discount_cents / 100:.2f}."
        message += delivery_message

        meta: dict[str, Any] = voucher.voucher_metadata or {}
        if body.idempotency_key:
            meta["idempotency_key"] = body.idempotency_key
        if moment_id:
            meta["moment_id"] = moment_id
        if body.action is not None:
            meta["redeem_action"] = body.action.model_dump()
            meta["child_id"] = str(child_id)
        meta["redeem_message"] = message
        voucher.voucher_metadata = meta

    redirect_url = "/app/onboarding" if body.create_account is not None else "/jornada"
    return VoucherRedeemResponse(
        success=True,
        voucher_id=str(voucher.id),
        assets_transferred=assets_transferred,
        child_id=str(child_id),
        message=message,
        redirect_url=redirect_url,
        discount_cents=voucher.discount_cents,
        delivery_id=str(voucher.delivery_id) if voucher.delivery_id else None,
        moment_id=moment_id,
        csrf_token=csrf_token_for_session,
    )


async def _ensure_child_for_account(db: AsyncSession, account_id: uuid.UUID, default_name: str | None) -> Child:
    """Recupera ou cria uma criança placeholder para associar momentos do resgate."""
    child = await db.scalar(
        select(Child)
        .where(Child.account_id == account_id)
        .order_by(Child.created_at.asc())
        .limit(1)
        .with_for_update()
    )
    if child:
        return child

    new_child = Child(
        id=uuid.uuid4(),
        account_id=account_id,
        name=default_name or "Seu bebê",
        pce_status="paid",
    )
    db.add(new_child)
    await db.flush()
    return new_child


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
