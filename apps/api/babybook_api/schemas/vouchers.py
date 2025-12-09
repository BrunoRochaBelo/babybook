"""
Schemas Pydantic para Vouchers (B2B2C)
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


VoucherStatus = Literal["available", "redeemed", "expired", "revoked"]


class VoucherBase(BaseModel):
    discount_cents: int = Field(default=0, ge=0)
    expires_at: datetime | None = None
    uses_limit: int = Field(default=1, ge=1)


class VoucherCreate(VoucherBase):
    """Schema para criação de um único voucher"""
    code: str | None = Field(default=None, max_length=32, pattern=r"^[A-Z0-9-]+$")


class VoucherBulkCreate(BaseModel):
    """Schema para criação de múltiplos vouchers em bulk"""
    count: int = Field(..., ge=1, le=1000)
    discount_cents: int = Field(default=0, ge=0)
    expires_at: datetime | None = None
    uses_limit: int = Field(default=1, ge=1)
    prefix: str | None = Field(default=None, max_length=10, pattern=r"^[A-Z0-9]+$")
    delivery_id: str | None = None


class VoucherUpdate(BaseModel):
    status: VoucherStatus | None = None
    expires_at: datetime | None = None
    uses_limit: int | None = Field(default=None, ge=1)


class VoucherResponse(VoucherBase):
    id: str
    partner_id: str
    code: str
    status: VoucherStatus
    uses_count: int
    beneficiary_id: str | None = None
    redeemed_at: datetime | None = None
    delivery_id: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VoucherRedeemRequest(BaseModel):
    """Request para resgatar um voucher"""
    code: str = Field(..., min_length=1, max_length=32)
    idempotency_key: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
        description="Chave idempotente para evitar resgates duplicados",
    )


class VoucherRedeemResponse(BaseModel):
    """Response após resgate de voucher"""
    voucher_id: str
    discount_cents: int
    delivery_id: str | None = None
    moment_id: str | None = Field(None, description="ID do momento criado com os arquivos importados")
    message: str


class VoucherBulkResponse(BaseModel):
    """Response após criação bulk de vouchers"""
    created_count: int
    vouchers: list[VoucherResponse]


class PaginatedVouchers(BaseModel):
    items: list[VoucherResponse]
    total: int
    next: str | None = None
