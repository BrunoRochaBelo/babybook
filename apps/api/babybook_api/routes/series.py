from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Series, SeriesOccurrence
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.series import (
    PaginatedOccurrences,
    PaginatedSeries,
    SeriesCreate,
    SeriesOccurrenceResponse,
    SeriesResponse,
)

router = APIRouter()


def _serialize_series(series: Series) -> SeriesResponse:
    return SeriesResponse(
        id=str(series.id),
        name=series.name,
        rrule=series.rrule,
        tz=series.tz,
        rev=series.rev,
        created_at=series.created_at,
        updated_at=series.updated_at,
    )


def _serialize_occurrence(occ: SeriesOccurrence) -> SeriesOccurrenceResponse:
    return SeriesOccurrenceResponse(
        id=str(occ.id),
        series_id=str(occ.series_id),
        scheduled_at=occ.scheduled_at,
        moment_id=str(occ.moment_id) if occ.moment_id else None,
    )


async def _get_series(
    db: AsyncSession,
    account_id: uuid.UUID,
    series_id: uuid.UUID,
) -> Series:
    stmt = select(Series).where(
        Series.id == series_id,
        Series.account_id == account_id,
        Series.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    series = result.scalar_one_or_none()
    if series is None:
        raise AppError(status_code=404, code="series.not_found", message="Serie nao encontrada.")
    return series


@router.get("/series", response_model=PaginatedSeries, summary="Lista series")
async def list_series(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedSeries:
    stmt = (
        select(Series)
        .where(Series.account_id == uuid.UUID(current_user.account_id), Series.deleted_at.is_(None))
        .order_by(Series.created_at.desc())
        .limit(limit)
    )
    items = [_serialize_series(row) for row in (await db.execute(stmt)).scalars().all()]
    return PaginatedSeries(items=items, next=None)


@router.post(
    "/series",
    response_model=SeriesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria serie",
)
async def create_series(
    payload: SeriesCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SeriesResponse:
    series = Series(
        account_id=uuid.UUID(current_user.account_id),
        name=payload.name,
        rrule=payload.rrule,
        tz=payload.tz,
    )
    db.add(series)
    await db.flush()
    await db.commit()
    await db.refresh(series)
    return _serialize_series(series)


@router.get(
    "/series/{series_id}/occurrences",
    response_model=PaginatedOccurrences,
    summary="Lista ocorrencias de uma serie",
)
async def list_occurrences(
    series_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(50, ge=1, le=200),
) -> PaginatedOccurrences:
    series = await _get_series(db, uuid.UUID(current_user.account_id), series_id)
    stmt = (
        select(SeriesOccurrence)
        .where(SeriesOccurrence.series_id == series.id)
        .order_by(SeriesOccurrence.scheduled_at.asc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return PaginatedOccurrences(items=[_serialize_occurrence(row) for row in rows], next=None)
