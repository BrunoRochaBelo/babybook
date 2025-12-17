from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from babybook_api.schemas.vouchers import VoucherRedeemAction


class MeResponse(BaseModel):
    id: str = Field(..., description="Identificador do usuario (account-scoped).")
    email: EmailStr
    name: str
    locale: str
    has_purchased: bool = False
    onboarding_completed: bool = False


class MeUpdateRequest(BaseModel):
    name: str | None = None
    locale: str | None = None


class UsageResponse(BaseModel):
    bytes_used: int = 0
    bytes_quota: int
    moments_used: int = 0
    moments_quota: int


class PendingDeliveryItem(BaseModel):
    delivery_id: str
    partner_name: str | None = None
    title: str
    assets_count: int = 0
    created_at: datetime


class PendingDeliveriesResponse(BaseModel):
    items: list[PendingDeliveryItem] = Field(default_factory=list)
    total: int = 0


class DeliveryImportRequest(BaseModel):
    """Importa uma entrega do parceiro direto no app (sem voucher).

    - EXISTING_CHILD: grátis
    - NEW_CHILD: debita 1 crédito do parceiro (se houver saldo)
    """

    idempotency_key: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
        description="Chave idempotente para evitar import duplicado",
    )
    action: VoucherRedeemAction = Field(
        ..., description="Ação de vinculação (NEW_CHILD ou EXISTING_CHILD)."
    )


class DeliveryImportResponse(BaseModel):
    success: bool = True
    delivery_id: str
    assets_transferred: int = 0
    child_id: str
    moment_id: str
    message: str
