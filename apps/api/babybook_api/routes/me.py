from __future__ import annotations

import hashlib
from dataclasses import replace

from datetime import datetime

import uuid

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Asset, Child, Moment, Delivery, Partner, PartnerLedger
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.me import (
    DeliveryImportRequest,
    DeliveryImportResponse,
    MeResponse,
    MeUpdateRequest,
    PendingDeliveriesResponse,
    PendingDeliveryItem,
    UsageResponse,
)
from babybook_api.settings import settings
from babybook_api.storage import PartnerStorageService, get_partner_storage

router = APIRouter()


def _compute_etag(user: UserSession) -> str:
    digest = hashlib.sha256(f"{user.id}:{user.email}:{user.locale}".encode("utf-8")).hexdigest()
    return f'W/"{digest[:16]}"'


def _serialize_user(user: UserSession) -> MeResponse:
    return MeResponse(id=user.id, email=user.email, name=user.name, locale=user.locale)


@router.get("/", response_model=MeResponse, summary="Retorna dados do usuario autenticado")
async def get_me(response: Response, current_user: UserSession = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)) -> MeResponse:
    response.headers["ETag"] = _compute_etag(current_user)
    # compute has_purchased and onboarding_completed by inspecting account
    from babybook_api.deps import get_db_session
    from sqlalchemy.ext.asyncio import AsyncSession

    async def _get_flags(db: AsyncSession) -> tuple[bool, bool]:
        account_id = uuid.UUID(current_user.account_id)
        stmt_account = select(Account).where(Account.id == account_id)
        account = (await db.execute(stmt_account)).scalar_one()
        has_purchased = (
            (account.plan and account.plan != "plano_base")
            or bool(account.unlimited_social)
            or bool(account.unlimited_creative)
            or bool(account.unlimited_tracking)
        )
        stmt_children = select(func.count()).select_from(Child).where(
            Child.account_id == account_id,
            Child.deleted_at.is_(None),
        )
        # Simple onboarding heuristic: hasChildren or hasMoments
        children_count = (await db.execute(stmt_children)).scalar_one()
        onboarding_completed = children_count > 0
        return has_purchased, onboarding_completed

    has_purchased, onboarding_completed = await _get_flags(db)
    result = _serialize_user(current_user)
    result.has_purchased = has_purchased
    result.onboarding_completed = onboarding_completed
    return result


@router.patch(
    "/",
    response_model=MeResponse,
    summary="Atualiza preferencias basicas do usuario",
)
async def patch_me(
    payload: MeUpdateRequest,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    current_user: UserSession = Depends(get_current_user),
) -> MeResponse:
    current_etag = _compute_etag(current_user)
    if if_match is None:
        raise AppError(
            status_code=412,
            code="me.precondition.required",
            message="Cabecalho If-Match obrigatorio.",
        )
    if if_match != current_etag:
        raise AppError(
            status_code=412,
            code="me.precondition.failed",
            message="Versao desatualizada. Recarregue os dados.",
        )

    updated_user = replace(
        current_user,
        name=payload.name or current_user.name,
        locale=payload.locale or current_user.locale,
    )
    new_etag = _compute_etag(updated_user)
    response.headers["ETag"] = new_etag
    return _serialize_user(updated_user)


@router.get(
    "/usage",
    response_model=UsageResponse,
    summary="Uso atual e quotas efetivas",
)
async def usage_summary(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    child_id: uuid.UUID = Query(
        ..., 
        description="ID do Child (Livro) para retornar quota/uso de storage de forma child-centric.",
    ),
) -> UsageResponse:
    account_id = uuid.UUID(current_user.account_id)

    stmt_child = select(Child).where(
        Child.id == child_id,
        Child.account_id == account_id,
        Child.deleted_at.is_(None),
    )
    child = (await db.execute(stmt_child)).scalar_one_or_none()
    if child is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")

    stmt_moments = select(func.count()).select_from(Moment).where(
        Moment.account_id == account_id,
        Moment.child_id == child.id,
        Moment.deleted_at.is_(None),
    )
    moments_used = (await db.execute(stmt_moments)).scalar_one()

    stmt_used = select(func.coalesce(func.sum(Asset.size_bytes), 0)).where(
        Asset.account_id == account_id,
        Asset.child_id == child.id,
        Asset.status != "failed",
    )
    bytes_used = (await db.execute(stmt_used)).scalar_one()

    return UsageResponse(
        bytes_used=bytes_used,
        bytes_quota=child.storage_quota_bytes,
        moments_used=moments_used,
        moments_quota=settings.quota_moments,
    )


@router.get(
    "/deliveries/pending",
    response_model=PendingDeliveriesResponse,
    summary="Lista entregas pendentes para importação direta (sem voucher)",
)
async def list_pending_deliveries(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PendingDeliveriesResponse:
    account_id = uuid.UUID(current_user.account_id)

    stmt = (
        select(Delivery)
        .options(selectinload(Delivery.partner))
        .where(
            Delivery.target_account_id == account_id,
            Delivery.status == "ready",
            Delivery.credit_status == "not_required",
            Delivery.assets_transferred_at.is_(None),
        )
        .order_by(Delivery.created_at.desc())
        .limit(50)
    )

    rows = await db.execute(stmt)
    deliveries = rows.scalars().all()

    items = [
        PendingDeliveryItem(
            delivery_id=str(d.id),
            partner_name=(d.partner.company_name or d.partner.name) if d.partner else None,
            title=d.title,
            assets_count=len(d.assets_payload.get("files", [])) if d.assets_payload else 0,
            created_at=d.created_at,
        )
        for d in deliveries
    ]

    return PendingDeliveriesResponse(items=items, total=len(items))


@router.post(
    "/deliveries/{delivery_id}/import",
    response_model=DeliveryImportResponse,
    summary="Importa uma entrega do parceiro no app (sem voucher)",
)
async def import_delivery(
    delivery_id: str,
    body: DeliveryImportRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    storage: PartnerStorageService = Depends(get_partner_storage),
) -> DeliveryImportResponse:
    account_id = uuid.UUID(current_user.account_id)
    now = datetime.utcnow()

    try:
        delivery = await db.scalar(
            select(Delivery)
            .options(selectinload(Delivery.partner))
            .where(Delivery.id == uuid.UUID(delivery_id))
            .with_for_update()
        )
        if delivery is None:
            raise AppError(status_code=404, code="delivery.not_found", message="Entrega não encontrada.")

        if delivery.target_account_id != account_id:
            raise AppError(status_code=403, code="delivery.forbidden", message="Sem acesso a esta entrega.")

        direct_import_flag = bool((delivery.assets_payload or {}).get("direct_import"))
        if not direct_import_flag:
            raise AppError(
                status_code=400,
                code="delivery.not_direct_import",
                message="Esta entrega não está habilitada para importação direta.",
            )

        if delivery.credit_status not in ("not_required", "consumed"):
            raise AppError(
                status_code=409,
                code="delivery.invalid_credit_state",
                message="Estado de crédito inválido para importação desta entrega.",
            )

        # Idempotência (por entrega)
        meta = delivery.delivery_metadata or {}
        if body.idempotency_key and meta.get("direct_import_idempotency_key") == body.idempotency_key:
            prev = meta.get("direct_import_result") or {}
            if prev.get("moment_id") and prev.get("child_id"):
                return DeliveryImportResponse(
                    success=True,
                    delivery_id=str(delivery.id),
                    assets_transferred=int(prev.get("assets_transferred") or 0),
                    child_id=str(prev["child_id"]),
                    moment_id=str(prev["moment_id"]),
                    message=str(prev.get("message") or "Entrega já importada."),
                )

        if delivery.assets_transferred_at is not None or delivery.status in ("completed",):
            raise AppError(
                status_code=409,
                code="delivery.already_imported",
                message="Esta entrega já foi importada.",
            )

        # Resolve Child de destino
        action = body.action

        if action.type == "EXISTING_CHILD":
            try:
                child_uuid = uuid.UUID(action.child_id)
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
                raise AppError(status_code=404, code="child.not_found", message="Child não encontrado.")
            if child.pce_status != "paid":
                raise AppError(
                    status_code=400,
                    code="child.pce.unpaid",
                    message="Este Livro ainda não está com PCE pago.",
                )

        else:
            # NEW_CHILD: cobra parceiro 1 crédito (late binding) e cria novo livro
            locked_partner = await db.scalar(
                select(Partner).where(Partner.id == delivery.partner_id).with_for_update()
            )
            if locked_partner is None:
                raise AppError(status_code=404, code="partner.not_found", message="Parceiro não encontrado.")
            if locked_partner.voucher_balance < 1:
                raise AppError(
                    status_code=402,
                    code="partner.insufficient_credits",
                    message="O fotógrafo está sem créditos para criar um novo Livro. Peça para ele comprar mais créditos.",
                )
            locked_partner.voucher_balance -= 1
            db.add(
                PartnerLedger(
                    id=uuid.uuid4(),
                    partner_id=delivery.partner_id,
                    amount=-1,
                    type="reservation",
                    description=f"consumption delivery={delivery.id} direct_import=true",
                )
            )

            child = Child(
                id=uuid.uuid4(),
                account_id=account_id,
                name=(action.child_name or "Seu bebê"),
                pce_status="paid",
            )
            db.add(child)
            await db.flush()

            delivery.credit_status = "consumed"

        # Cria momento e copia assets
        new_moment = Moment(
            id=uuid.uuid4(),
            account_id=account_id,
            child_id=child.id,
            title=delivery.title or "Entrega do parceiro",
            summary=delivery.description,
            occurred_at=delivery.event_date,
            status="published",
        )
        db.add(new_moment)
        await db.flush()

        copy_results = await storage.copy_delivery_to_user(
            partner_id=str(delivery.partner_id),
            delivery_id=str(delivery.id),
            target_user_id=str(account_id),
            target_moment_id=str(new_moment.id),
        )

        assets_transferred = len([r for r in copy_results if r.success])
        if any(not r.success for r in copy_results):
            errors = [r.error for r in copy_results if not r.success and r.error]
            raise AppError(
                status_code=500,
                code="delivery.copy_failed",
                message=f"Falha ao copiar arquivos: {'; '.join(errors)}",
            )

        delivery.status = "completed"
        delivery.assets_transferred_at = now
        delivery.completed_at = now
        delivery.beneficiary_email = current_user.email

        result_meta = {
            "moment_id": str(new_moment.id),
            "child_id": str(child.id),
            "assets_transferred": assets_transferred,
            "message": "Entrega importada com sucesso!",
            "action": body.action.model_dump(),
        }
        if body.idempotency_key:
            meta["direct_import_idempotency_key"] = body.idempotency_key
        meta["direct_import_result"] = result_meta
        delivery.delivery_metadata = meta

        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return DeliveryImportResponse(
        success=True,
        delivery_id=str(delivery.id),
        assets_transferred=assets_transferred,
        child_id=str(child.id),
        moment_id=str(new_moment.id),
        message="Entrega importada com sucesso!",
    )
