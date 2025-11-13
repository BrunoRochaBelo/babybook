from __future__ import annotations

import secrets
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Child, GuestbookEntry, Moment, ShareLink
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.guestbook import GuestbookCreate, GuestbookEntryResponse
from babybook_api.schemas.shares import ShareCreate, ShareCreatedResponse
from babybook_api.security import hash_password
from babybook_api.settings import settings

router = APIRouter()


async def _get_share_by_token(db: AsyncSession, token: str) -> ShareLink | None:
    stmt = select(ShareLink).where(
        ShareLink.token == token,
        ShareLink.revoked_at.is_(None),
    ).options(selectinload(ShareLink.moment))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


def _share_url(token: str) -> str:
    return f"{settings.public_base_url}/shares/{token}"


def _serialize_guestbook(entry: GuestbookEntry) -> GuestbookEntryResponse:
    return GuestbookEntryResponse(
        id=str(entry.id),
        child_id=str(entry.child_id),
        author_name=entry.author_name,
        author_email=entry.author_email,
        message=entry.message,
        status=entry.status,
        created_at=entry.created_at,
    )


async def _ensure_child_exists(
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


@router.post(
    "/moments/{moment_id}/share",
    response_model=ShareCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria ou atualiza link publico de momento",
)
async def share_moment(
    moment_id: uuid.UUID,
    payload: ShareCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ShareCreatedResponse:
    stmt = select(Moment).where(
        Moment.id == moment_id,
        Moment.account_id == uuid.UUID(current_user.account_id),
        Moment.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    moment = result.scalar_one_or_none()
    if moment is None:
        raise AppError(status_code=404, code="moment.not_found", message="Momento nao encontrado.")
    if moment.status != "published":
        raise AppError(
            status_code=409,
            code="share.moment.not_published",
            message="Momento precisa estar publicado para ser compartilhado.",
        )

    stmt_share = select(ShareLink).where(ShareLink.moment_id == moment.id, ShareLink.revoked_at.is_(None))
    result_share = await db.execute(stmt_share)
    share = result_share.scalar_one_or_none()
    token = secrets.token_urlsafe(16)

    password_hash = hash_password(payload.password) if payload.password else None
    if share:
        share.token = token
        share.password_hash = password_hash
        share.expires_at = payload.expires_at
    else:
        share = ShareLink(
            account_id=moment.account_id,
            moment_id=moment.id,
            token=token,
            password_hash=password_hash,
            expires_at=payload.expires_at,
        )
        db.add(share)
    await db.flush()
    await db.commit()
    await db.refresh(share)

    return ShareCreatedResponse(
        id=str(share.id),
        moment_id=str(moment.id),
        token=share.token,
        url=_share_url(share.token),
        expires_at=share.expires_at,
    )


@router.delete(
    "/shares/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoga link de compartilhamento",
)
async def delete_share(
    share_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    stmt = select(ShareLink).where(
        ShareLink.id == share_id,
        ShareLink.account_id == uuid.UUID(current_user.account_id),
    )
    result = await db.execute(stmt)
    share = result.scalar_one_or_none()
    if share is None:
        raise AppError(status_code=404, code="share.not_found", message="Share nao encontrado.")
    share.revoked_at = datetime.utcnow()
    await db.flush()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/shares/{token}", summary="Recupera metadados publicos de um share")
async def get_public_share(
    token: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    share = await _get_share_by_token(db, token)
    if share is None or (share.expires_at and share.expires_at < datetime.utcnow()):
        raise AppError(status_code=404, code="share.not_found", message="Share nao encontrado.")

    moment = share.moment
    return {
        "token": share.token,
        "moment": {
            "id": str(moment.id),
            "title": moment.title,
            "summary": moment.summary,
            "occurred_at": moment.occurred_at,
            "child_id": str(moment.child_id),
        },
        "media": [],
    }


@router.post(
    "/shares/{token}/guestbook",
    response_model=GuestbookEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assina guestbook via link publico",
)
async def create_public_guestbook_entry(
    token: str,
    payload: GuestbookCreate,
    db: AsyncSession = Depends(get_db_session),
) -> GuestbookEntryResponse:
    share = await _get_share_by_token(db, token)
    if share is None or (share.expires_at and share.expires_at < datetime.utcnow()):
        raise AppError(status_code=404, code="share.not_found", message="Share nao encontrado.")
    moment = share.moment
    if moment is None:
        raise AppError(status_code=404, code="moment.not_found", message="Momento nao encontrado.")
    if payload.child_id != moment.child_id:
        raise AppError(
            status_code=400,
            code="guestbook.child.mismatch",
            message="Child nao corresponde ao momento compartilhado.",
        )
    await _ensure_child_exists(db, share.account_id, payload.child_id)
    entry = GuestbookEntry(
        account_id=share.account_id,
        child_id=payload.child_id,
        share_link_id=share.id,
        author_name=payload.author_name,
        author_email=payload.author_email,
        message=payload.message,
        status="pending",
    )
    db.add(entry)
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return _serialize_guestbook(entry)
