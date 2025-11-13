from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SeriesCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)
    rrule: str = Field(..., min_length=1, max_length=500)
    tz: str = Field(default="UTC", max_length=64)


class SeriesResponse(BaseModel):
    id: str
    name: str
    rrule: str
    tz: str
    rev: int
    created_at: datetime
    updated_at: datetime


class PaginatedSeries(BaseModel):
    items: list[SeriesResponse]
    next: str | None = None


class SeriesOccurrenceResponse(BaseModel):
    id: str
    series_id: str
    scheduled_at: datetime
    moment_id: str | None


class PaginatedOccurrences(BaseModel):
    items: list[SeriesOccurrenceResponse]
    next: str | None = None
