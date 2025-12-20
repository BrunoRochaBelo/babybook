from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Child, GuestbookEntry
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.guestbook import (
    GuestbookCreate,
    GuestbookEntryResponse,
    PaginatedGuestbook,
)

router = APIRouter()


def _serialize_entry(entry: GuestbookEntry) -> GuestbookEntryResponse:
    return GuestbookEntryResponse(
        id=str(entry.id),
        child_id=str(entry.child_id),
        author_name=entry.author_name,
        author_email=entry.author_email,
        message=entry.message,
        status=entry.status,
        created_at=entry.created_at,
    )


async def _ensure_child(
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


@router.get("", response_model=PaginatedGuestbook, summary="Lista assinaturas do guestbook")
async def list_guestbook(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    child_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedGuestbook:
    stmt = select(GuestbookEntry).where(
        GuestbookEntry.account_id == uuid.UUID(current_user.account_id),
        GuestbookEntry.deleted_at.is_(None),
    )
    if child_id:
        stmt = stmt.where(GuestbookEntry.child_id == child_id)
    stmt = stmt.order_by(GuestbookEntry.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    items = [_serialize_entry(entry) for entry in result.scalars().all()]
    return PaginatedGuestbook(items=items, next=None)


@router.post(
    "",
    response_model=GuestbookEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria entrada autenticada no guestbook",
)
async def create_guestbook_entry(
    payload: GuestbookCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> GuestbookEntryResponse:
    account_id = uuid.UUID(current_user.account_id)
    await _ensure_child(db, account_id, payload.child_id)
    entry = GuestbookEntry(
        account_id=account_id,
        child_id=payload.child_id,
        author_name=payload.author_name,
        author_email=payload.author_email,
        message=payload.message,
        status="approved",
    )
    db.add(entry)
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return _serialize_entry(entry)
