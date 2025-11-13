from __future__ import annotations

import re
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Chapter, ChapterMoment, Child, Moment
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.chapters import (
    ChapterCreate,
    ChapterMomentsPatch,
    ChapterOrder,
    ChapterResponse,
    ChapterUpdate,
    PaginatedChapters,
)

router = APIRouter()


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:160] or "capitulo"


def _chapter_etag(chapter: Chapter) -> str:
    ts = chapter.updated_at or datetime.utcnow()
    return f'W/"{chapter.rev}-{int(ts.timestamp())}"'


def _serialize_chapter(chapter: Chapter) -> ChapterResponse:
    moment_ids = [str(item.moment_id) for item in sorted(chapter.moments, key=lambda m: m.position)]
    return ChapterResponse(
        id=str(chapter.id),
        child_id=str(chapter.child_id),
        title=chapter.title,
        slug=chapter.slug,
        description=chapter.description,
        cover_asset_id=str(chapter.cover_asset_id) if chapter.cover_asset_id else None,
        is_manual_order=chapter.is_manual_order,
        rev=chapter.rev,
        moment_ids=moment_ids,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
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
    if (await db.execute(stmt)).scalar_one_or_none() is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")


async def _get_chapter(
    db: AsyncSession,
    account_id: uuid.UUID,
    chapter_id: uuid.UUID,
) -> Chapter:
    stmt = (
        select(Chapter)
        .where(
            Chapter.id == chapter_id,
            Chapter.account_id == account_id,
            Chapter.deleted_at.is_(None),
        )
        .options(selectinload(Chapter.moments))
    )
    result = await db.execute(stmt)
    chapter = result.scalar_one_or_none()
    if chapter is None:
        raise AppError(status_code=404, code="chapter.not_found", message="Capitulo nao encontrado.")
    return chapter


async def _get_moment(
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


@router.get("/chapters", response_model=PaginatedChapters, summary="Lista capitulos")
async def list_chapters(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedChapters:
    stmt = (
        select(Chapter)
        .where(Chapter.account_id == uuid.UUID(current_user.account_id), Chapter.deleted_at.is_(None))
        .order_by(Chapter.created_at.desc())
        .limit(limit)
        .options(selectinload(Chapter.moments))
    )
    items = [_serialize_chapter(row) for row in (await db.execute(stmt)).scalars().all()]
    return PaginatedChapters(items=items, next=None)


@router.post(
    "/chapters",
    response_model=ChapterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria capitulo",
)
async def create_chapter(
    payload: ChapterCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChapterResponse:
    account_id = uuid.UUID(current_user.account_id)
    await _ensure_child(db, account_id, payload.child_id)
    slug = _slugify(payload.slug or payload.title)
    stmt = select(Chapter.id).where(Chapter.account_id == account_id, Chapter.slug == slug)
    if (await db.execute(stmt)).scalar_one_or_none():
        raise AppError(status_code=409, code="chapter.slug_in_use", message="Slug ja utilizado.")
    chapter = Chapter(
        account_id=account_id,
        child_id=payload.child_id,
        title=payload.title,
        description=payload.description,
        slug=slug,
        cover_asset_id=payload.cover_asset_id,
    )
    db.add(chapter)
    await db.flush()
    await db.commit()
    chapter = await _get_chapter(db, account_id, chapter.id)
    return _serialize_chapter(chapter)


@router.get("/chapters/{chapter_id}", response_model=ChapterResponse, summary="Busca capitulo")
async def get_chapter(
    chapter_id: uuid.UUID,
    response: Response,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChapterResponse:
    chapter = await _get_chapter(db, uuid.UUID(current_user.account_id), chapter_id)
    response.headers["ETag"] = _chapter_etag(chapter)
    return _serialize_chapter(chapter)


@router.patch(
    "/chapters/{chapter_id}",
    response_model=ChapterResponse,
    summary="Atualiza capitulo",
)
async def patch_chapter(
    chapter_id: uuid.UUID,
    payload: ChapterUpdate,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChapterResponse:
    chapter = await _get_chapter(db, uuid.UUID(current_user.account_id), chapter_id)
    etag = _chapter_etag(chapter)
    if if_match is None or if_match != etag:
        raise AppError(status_code=412, code="chapter.precondition_failed", message="ETag invalido.")
    if payload.title is not None:
        chapter.title = payload.title
    if payload.description is not None:
        chapter.description = payload.description
    if payload.slug is not None:
        new_slug = _slugify(payload.slug)
        stmt = select(Chapter.id).where(
            Chapter.account_id == chapter.account_id,
            Chapter.slug == new_slug,
            Chapter.id != chapter.id,
        )
        if (await db.execute(stmt)).scalar_one_or_none():
            raise AppError(status_code=409, code="chapter.slug_in_use", message="Slug ja utilizado.")
        chapter.slug = new_slug
    if payload.cover_asset_id is not None:
        chapter.cover_asset_id = payload.cover_asset_id
    chapter.rev += 1
    chapter.updated_at = datetime.utcnow()
    await db.flush()
    await db.commit()
    chapter = await _get_chapter(db, uuid.UUID(current_user.account_id), chapter_id)
    new_etag = _chapter_etag(chapter)
    response.headers["ETag"] = new_etag
    return _serialize_chapter(chapter)


@router.delete(
    "/chapters/{chapter_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove capitulo",
)
async def delete_chapter(
    chapter_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    chapter = await _get_chapter(db, uuid.UUID(current_user.account_id), chapter_id)
    chapter.deleted_at = datetime.utcnow()
    await db.flush()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/chapters/{chapter_id}/moments",
    response_model=ChapterResponse,
    summary="Gerencia momentos em capitulo",
)
async def patch_chapter_moments(
    chapter_id: uuid.UUID,
    payload: ChapterMomentsPatch,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ChapterResponse:
    account_id = uuid.UUID(current_user.account_id)
    chapter = await _get_chapter(db, account_id, chapter_id)
    existing = {item.moment_id: item for item in chapter.moments}
    next_position = (max((item.position for item in chapter.moments), default=0)) + 1

    for moment_id in payload.add:
        if moment_id in existing:
            continue
        await _get_moment(db, account_id, moment_id)
        new_item = ChapterMoment(chapter_id=chapter.id, moment_id=moment_id, position=next_position)
        next_position += 1
        chapter.moments.append(new_item)
        existing[moment_id] = new_item

    for moment_id in payload.remove:
        item = existing.get(moment_id)
        if item:
            await db.delete(item)

    await db.flush()
    await db.commit()
    chapter = await _get_chapter(db, account_id, chapter_id)
    return _serialize_chapter(chapter)


@router.put(
    "/chapters/{chapter_id}/order",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Define ordenacao manual",
)
async def put_chapter_order(
    chapter_id: uuid.UUID,
    payload: ChapterOrder,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    chapter = await _get_chapter(db, uuid.UUID(current_user.account_id), chapter_id)
    current_ids = {item.moment_id for item in chapter.moments}
    desired_ids = list(payload.order)
    if current_ids != set(desired_ids):
        raise AppError(status_code=400, code="chapter.order.mismatch", message="Lista deve conter todos os momentos atuais.")
    position_lookup = {moment_id: idx + 1 for idx, moment_id in enumerate(desired_ids)}
    for item in chapter.moments:
        item.position = position_lookup[item.moment_id]
    chapter.is_manual_order = True
    await db.flush()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
