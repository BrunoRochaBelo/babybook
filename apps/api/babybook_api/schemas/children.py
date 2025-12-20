from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class ChildBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    birthday: date | None = None
    avatar_url: str | None = Field(default=None)


class ChildCreate(ChildBase):
    pass


class ChildUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    birthday: date | None = None
    avatar_url: str | None = None


class ChildResponse(ChildBase):
    id: str
    created_at: datetime
    updated_at: datetime


class PaginatedChildren(BaseModel):
    items: list[ChildResponse]
    next: str | None = None
