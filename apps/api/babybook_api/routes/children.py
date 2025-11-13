from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Child
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.children import (
    ChildCreate,
    ChildResponse,
    ChildUpdate,
    PaginatedChildren,
)

router = APIRouter()


def _serialize_child(child: Child) -> ChildResponse:
    return ChildResponse(
        id=str(child.id),
        name=child.name,
        birthday=child.birthday,
        avatar_url=child.avatar_url,
        created_at=child.created_at,
        updated_at=child.updated_at,
    )


async def _get_child_or_404(
    db: AsyncSession,
    account_id: uuid.UUID,
    child_id: uuid.UUID,
) -> Child:
    stmt = (
        select(Child)
        .where(
            Child.id == child_id,
            Child.account_id == account_id,
            Child.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    child = result.scalar_one_or_none()
    if child is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")
    return child


@router.get(
    "",
    response_model=PaginatedChildren,
    summary="Lista criancas da conta",
)
async def list_children(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedChildren:
    stmt = (
        select(Child)
        .where(Child.account_id == uuid.UUID(current_user.account_id), Child.deleted_at.is_(None))
        .order_by(Child.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    items = [_serialize_child(child) for child in result.scalars().all()]
    return PaginatedChildren(items=items, next=None)


@router.post(
    "",
    response_model=ChildResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria nova crianca",
)
async def create_child(
    payload: ChildCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChildResponse:
    child = Child(
        account_id=uuid.UUID(current_user.account_id),
        name=payload.name,
        birthday=payload.birthday,
        avatar_url=payload.avatar_url,
    )
    db.add(child)
    await db.flush()
    await db.commit()
    await db.refresh(child)
    return _serialize_child(child)


@router.get(
    "/{child_id}",
    response_model=ChildResponse,
    summary="Recupera detalhes de uma crianca",
)
async def get_child(
    child_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChildResponse:
    child = await _get_child_or_404(db, uuid.UUID(current_user.account_id), child_id)
    return _serialize_child(child)


@router.patch(
    "/{child_id}",
    response_model=ChildResponse,
    summary="Atualiza dados basicos da crianca",
)
async def patch_child(
    child_id: uuid.UUID,
    payload: ChildUpdate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChildResponse:
    child = await _get_child_or_404(db, uuid.UUID(current_user.account_id), child_id)
    if payload.name is not None:
        child.name = payload.name
    if payload.birthday is not None:
        child.birthday = payload.birthday
    if payload.avatar_url is not None:
        child.avatar_url = payload.avatar_url
    await db.flush()
    await db.commit()
    await db.refresh(child)
    return _serialize_child(child)


@router.delete(
    "/{child_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove logicamente uma crianca",
)
async def delete_child(
    child_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    from datetime import datetime

    child = await _get_child_or_404(db, uuid.UUID(current_user.account_id), child_id)
    child.deleted_at = child.deleted_at or datetime.utcnow()
    await db.flush()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
