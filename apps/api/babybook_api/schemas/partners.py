"""
Schemas Pydantic para Partners (B2B2C)
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

PartnerStatus = Literal["active", "inactive", "suspended"]


class PartnerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    company_name: str | None = Field(default=None, max_length=200)
    cnpj: str | None = Field(default=None, max_length=18)
    contact_name: str | None = Field(default=None, max_length=160)
    notes: str | None = None


class PartnerCreate(PartnerBase):
    slug: str = Field(..., min_length=1, max_length=80, pattern=r"^[a-z0-9-]+$")


class PartnerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    company_name: str | None = Field(default=None, max_length=200)
    cnpj: str | None = Field(default=None, max_length=18)
    contact_name: str | None = Field(default=None, max_length=160)
    notes: str | None = None
    status: PartnerStatus | None = None


class PartnerResponse(PartnerBase):
    id: str
    slug: str
    status: PartnerStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PartnerDetailResponse(PartnerResponse):
    vouchers_count: int = 0
    deliveries_count: int = 0
    redeemed_vouchers_count: int = 0


class PaginatedPartners(BaseModel):
    items: list[PartnerResponse]
    total: int
    next: str | None = None
