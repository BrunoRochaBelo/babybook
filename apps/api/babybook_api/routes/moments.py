from __future__ import annotations

import math
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Header, Query, Response, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user, require_csrf_token
from babybook_api.db.models import Child, Moment
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.request_ip import get_client_ip
from babybook_api.schemas.moments import (
    MomentCreate,
    MomentResponse,
    MomentUpdate,
    PaginatedMoments,
    PublishResponse,
)
from babybook_api.utils.security import sanitize_html

router = APIRouter()


def _moment_to_response(moment: Moment) -> MomentResponse:
    return MomentResponse(
        id=str(moment.id),
        child_id=str(moment.child_id),
        template_key=moment.template_key,
        title=moment.title,
        summary=moment.summary,
        occurred_at=moment.occurred_at,
        status=moment.status,  # type: ignore[arg-type]
        privacy=moment.privacy,  # type: ignore[arg-type]
        payload=moment.payload or {},
        rev=moment.rev,
        created_at=moment.created_at,
        updated_at=moment.updated_at,
        published_at=moment.published_at,
    )


def _compute_etag(moment: Moment) -> str:
    ts = int(moment.updated_at.timestamp()) if moment.updated_at else math.floor(datetime.utcnow().timestamp())
    return f'W/"{moment.rev}-{ts}"'


async def _ensure_child_access(
    db: AsyncSession,
    account_id: uuid.UUID,
    child_id: uuid.UUID,
) -> None:
    stmt = select(Child.id).where(
        Child.id == child_id,
        Child.account_id == account_id,
        Child.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")


async def _get_moment_or_404(
    db: AsyncSession,
    account_id: uuid.UUID,
    moment_id: uuid.UUID,
) -> Moment:
    stmt = select(Moment).where(
        Moment.id == moment_id,
        Moment.account_id == account_id,
        Moment.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    moment = result.scalar_one_or_none()
    if moment is None:
        raise AppError(status_code=404, code="moment.not_found", message="Momento nao encontrado.")
    return moment


@router.get("", response_model=PaginatedMoments, summary="Lista momentos com filtros")
async def list_moments(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    status_filter: str | None = Query(default=None, alias="status"),
    child_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedMoments:
    stmt = select(Moment).where(
        Moment.account_id == uuid.UUID(current_user.account_id),
        Moment.deleted_at.is_(None),
    )
    if status_filter:
        stmt = stmt.where(Moment.status == status_filter)
    if child_id:
        stmt = stmt.where(Moment.child_id == child_id)
    stmt = stmt.order_by(Moment.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    items = [_moment_to_response(moment) for moment in result.scalars().all()]
    return PaginatedMoments(items=items, next=None)


@router.post(
    "",
    response_model=MomentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria momento (template ou avulso)",
)
async def create_moment(
    payload: MomentCreate,
    response: Response,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    request: Request = None,
    _: None = Depends(require_csrf_token),
) -> MomentResponse:
    await enforce_rate_limit(bucket="moments:create:user", limit="20/minute", identity=current_user.id)
    account_id = uuid.UUID(current_user.account_id)
    await _ensure_child_access(db, account_id, payload.child_id)
    moment = Moment(
        account_id=account_id,
        child_id=payload.child_id,
        template_key=payload.template_key,
        title=sanitize_html(payload.title) or "Sem titulo",
        summary=sanitize_html(payload.summary),
        occurred_at=payload.occurred_at,
        privacy=payload.privacy,
        payload=payload.payload or {},
    )
    db.add(moment)
    await db.flush()
    await db.commit()
    await db.refresh(moment)
    response.headers["ETag"] = _compute_etag(moment)
    return _moment_to_response(moment)


@router.get(
    "/{moment_id}",
    response_model=MomentResponse,
    summary="Recupera um momento",
)
async def get_moment(
    moment_id: uuid.UUID,
    response: Response,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MomentResponse:
    moment = await _get_moment_or_404(db, uuid.UUID(current_user.account_id), moment_id)
    response.headers["ETag"] = _compute_etag(moment)
    return _moment_to_response(moment)


@router.patch(
    "/{moment_id}",
    response_model=MomentResponse,
    summary="Atualiza campos editaveis de um momento",
)
async def patch_moment(
    moment_id: uuid.UUID,
    payload: MomentUpdate,
    response: Response,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    if_match: str | None = Header(default=None, alias="If-Match"),
    _: None = Depends(require_csrf_token),
) -> MomentResponse:
    await enforce_rate_limit(bucket="moments:patch:user", limit="30/minute", identity=current_user.id)
    if if_match is None:
        raise AppError(
            status_code=412,
            code="moment.precondition.required",
            message="Cabecalho If-Match obrigatorio.",
        )
    moment = await _get_moment_or_404(db, uuid.UUID(current_user.account_id), moment_id)
    if _compute_etag(moment) != if_match:
        raise AppError(
            status_code=412,
            code="moment.precondition.failed",
            message="Versao desatualizada. Recarregue os dados.",
        )
    if payload.title is not None:
        moment.title = sanitize_html(payload.title) or "Sem titulo"
    if payload.summary is not None:
        moment.summary = sanitize_html(payload.summary)
    if payload.occurred_at is not None:
        moment.occurred_at = payload.occurred_at
    if payload.privacy is not None:
        moment.privacy = payload.privacy
    if payload.payload is not None:
        moment.payload = payload.payload
    moment.rev += 1
    moment.updated_at = datetime.utcnow()
    await db.flush()
    await db.commit()
    await db.refresh(moment)
    response.headers["ETag"] = _compute_etag(moment)
    return _moment_to_response(moment)


@router.delete(
    "/{moment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove logicamente um momento",
)
async def delete_moment(
    moment_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> Response:
    await enforce_rate_limit(bucket="moments:delete:user", limit="30/minute", identity=current_user.id)
    moment = await _get_moment_or_404(db, uuid.UUID(current_user.account_id), moment_id)
    moment.deleted_at = datetime.utcnow()
    moment.status = "archived"
    await db.flush()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{moment_id}/publish",
    response_model=PublishResponse,
    summary="Publica um momento (se pronto)",
)
async def publish_moment(
    moment_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> PublishResponse:
    await enforce_rate_limit(bucket="moments:publish:user", limit="30/minute", identity=current_user.id)
    moment = await _get_moment_or_404(db, uuid.UUID(current_user.account_id), moment_id)
    moment.status = "published"
    moment.published_at = datetime.utcnow()
    moment.rev += 1
    await db.flush()
    await db.commit()
    return PublishResponse(status="published", published_at=moment.published_at)


@router.post(
    "/{moment_id}/unpublish",
    response_model=PublishResponse,
    summary="Retorna momento a rascunho",
)
async def unpublish_moment(
    moment_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> PublishResponse:
    await enforce_rate_limit(bucket="moments:unpublish:user", limit="30/minute", identity=current_user.id)
    moment = await _get_moment_or_404(db, uuid.UUID(current_user.account_id), moment_id)
    moment.status = "draft"
    moment.published_at = None
    moment.rev += 1
    await db.flush()
    await db.commit()
    return PublishResponse(status="draft", published_at=None)
