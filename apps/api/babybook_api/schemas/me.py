from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class MeResponse(BaseModel):
    id: str = Field(..., description="Identificador do usuario (account-scoped).")
    email: EmailStr
    name: str
    locale: str


class MeUpdateRequest(BaseModel):
    name: str | None = None
    locale: str | None = None


class UsageResponse(BaseModel):
    bytes_used: int = 0
    bytes_quota: int
    moments_used: int = 0
    moments_quota: int
