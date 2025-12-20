"""
Schemas Pydantic para Deliveries (B2B2C)
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

DeliveryStatus = Literal["pending", "processing", "completed", "failed"]


class DeliveryAssetBase(BaseModel):
    asset_id: str
    position: int = 0


class DeliveryAssetCreate(DeliveryAssetBase):
    pass


class DeliveryAssetResponse(DeliveryAssetBase):
    id: str
    delivery_id: str
    transferred_at: datetime | None = None
    target_asset_id: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeliveryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    beneficiary_email: EmailStr | None = None
    beneficiary_name: str | None = Field(default=None, max_length=160)
    beneficiary_phone: str | None = Field(default=None, max_length=32)


class DeliveryCreate(DeliveryBase):
    """Schema para criação de delivery"""
    asset_ids: list[str] = Field(default_factory=list)
    voucher_code: str | None = None  # Opcional: associar voucher existente


class DeliveryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    beneficiary_email: EmailStr | None = None
    beneficiary_name: str | None = Field(default=None, max_length=160)
    beneficiary_phone: str | None = Field(default=None, max_length=32)
    status: DeliveryStatus | None = None


class DeliveryAddAssets(BaseModel):
    """Schema para adicionar assets a uma delivery"""
    asset_ids: list[str] = Field(..., min_length=1)


class DeliveryResponse(DeliveryBase):
    id: str
    partner_id: str
    status: DeliveryStatus
    target_account_id: str | None = None
    assets_transferred_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeliveryDetailResponse(DeliveryResponse):
    assets: list[DeliveryAssetResponse] = []
    voucher_code: str | None = None


class PaginatedDeliveries(BaseModel):
    items: list[DeliveryResponse]
    total: int
    next: str | None = None
