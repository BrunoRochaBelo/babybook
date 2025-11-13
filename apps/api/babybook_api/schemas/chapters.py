from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChapterCreate(BaseModel):
    child_id: UUID
    title: str = Field(..., min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    slug: str | None = Field(default=None, max_length=160)
    cover_asset_id: UUID | None = None


class ChapterUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    slug: str | None = Field(default=None, max_length=160)
    cover_asset_id: UUID | None = None


class ChapterResponse(BaseModel):
    id: str
    child_id: str
    title: str
    slug: str
    description: str | None
    cover_asset_id: str | None
    is_manual_order: bool
    rev: int
    moment_ids: list[str]
    created_at: datetime
    updated_at: datetime


class PaginatedChapters(BaseModel):
    items: list[ChapterResponse]
    next: str | None = None


class ChapterMomentsPatch(BaseModel):
    add: list[UUID] = Field(default_factory=list)
    remove: list[UUID] = Field(default_factory=list)


class ChapterOrder(BaseModel):
    order: list[UUID] = Field(..., min_length=1)
