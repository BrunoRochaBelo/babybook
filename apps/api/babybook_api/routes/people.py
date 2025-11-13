from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Person
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.people import (
    PaginatedPeople,
    PersonCreate,
    PersonResponse,
    PersonUpdate,
)

router = APIRouter()


def _serialize_person(person: Person) -> PersonResponse:
    return PersonResponse(
        id=str(person.id),
        name=person.name,
        avatar_url=person.avatar_url,
        created_at=person.created_at,
        updated_at=person.updated_at,
    )


async def _get_person_or_404(
    db: AsyncSession,
    account_id: uuid.UUID,
    person_id: uuid.UUID,
) -> Person:
    stmt = (
        select(Person)
        .where(
            Person.id == person_id,
            Person.account_id == account_id,
            Person.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    person = result.scalar_one_or_none()
    if person is None:
        raise AppError(status_code=404, code="person.not_found", message="Pessoa nao encontrada.")
    return person


@router.get("", response_model=PaginatedPeople, summary="Lista pessoas ligadas a conta")
async def list_people(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedPeople:
    stmt = (
        select(Person)
        .where(Person.account_id == uuid.UUID(current_user.account_id), Person.deleted_at.is_(None))
        .order_by(Person.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    items = [_serialize_person(person) for person in result.scalars().all()]
    return PaginatedPeople(items=items, next=None)


@router.post(
    "",
    response_model=PersonResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria pessoa",
)
async def create_person(
    payload: PersonCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PersonResponse:
    person = Person(
        account_id=uuid.UUID(current_user.account_id),
        name=payload.name,
        avatar_url=payload.avatar_url,
    )
    db.add(person)
    await db.flush()
    await db.commit()
    await db.refresh(person)
    return _serialize_person(person)


@router.patch(
    "/{person_id}",
    response_model=PersonResponse,
    summary="Atualiza pessoa",
)
async def update_person(
    person_id: uuid.UUID,
    payload: PersonUpdate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PersonResponse:
    person = await _get_person_or_404(db, uuid.UUID(current_user.account_id), person_id)
    if payload.name is not None:
        person.name = payload.name
    if payload.avatar_url is not None:
        person.avatar_url = payload.avatar_url
    await db.flush()
    await db.commit()
    await db.refresh(person)
    return _serialize_person(person)


@router.delete(
    "/{person_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove logicamente uma pessoa",
)
async def delete_person(
    person_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    from datetime import datetime

    person = await _get_person_or_404(db, uuid.UUID(current_user.account_id), person_id)
    person.deleted_at = person.deleted_at or datetime.utcnow()
    await db.flush()
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
