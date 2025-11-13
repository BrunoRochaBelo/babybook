from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None)


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None)


class PersonResponse(PersonBase):
    id: str
    created_at: datetime
    updated_at: datetime


class PaginatedPeople(BaseModel):
    items: list[PersonResponse]
    next: str | None = None
