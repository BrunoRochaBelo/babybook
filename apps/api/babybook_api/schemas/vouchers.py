"""
Schemas Pydantic para Vouchers (B2B2C)
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

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


# =============================================================================
# Public B2B2C flow (Validate / Redeem)
# =============================================================================


class VoucherPublic(BaseModel):
    """Representação pública mínima do voucher para o fluxo de resgate."""

    id: str
    code: str
    partner_id: str
    partner_name: str | None = None
    delivery_id: str | None = None
    beneficiary_id: str | None = None
    expires_at: datetime | None = None
    uses_left: int
    max_uses: int
    is_active: bool
    created_at: datetime
    redeemed_at: datetime | None = None


class VoucherValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=32)


class VoucherValidationResult(BaseModel):
    valid: bool
    voucher: VoucherPublic | None = None
    error_code: str | None = None
    error_message: str | None = None
    partner_name: str | None = None
    delivery_title: str | None = None
    assets_count: int = 0


class VoucherRedeemCreateAccount(BaseModel):
    email: str = Field(..., min_length=3, max_length=180)
    name: str = Field(..., min_length=1, max_length=160)
    password: str = Field(..., min_length=6, max_length=128)


class VoucherRedeemActionExistingChild(BaseModel):
    type: Literal["EXISTING_CHILD"]
    child_id: str = Field(..., description="ID do Child (Livro) existente")


class VoucherRedeemActionNewChild(BaseModel):
    type: Literal["NEW_CHILD"]
    child_name: str | None = Field(default=None, description="Nome opcional para o novo Child (Livro)")


VoucherRedeemAction = Annotated[
    VoucherRedeemActionExistingChild | VoucherRedeemActionNewChild,
    Field(discriminator="type"),
]


class VoucherRedeemRequest(BaseModel):
    """Request para resgatar um voucher (Late Binding)."""

    code: str = Field(..., min_length=1, max_length=32)
    idempotency_key: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
        description="Chave idempotente para evitar resgates duplicados",
    )

    # Compatibilidade com o fluxo atual do frontend (criação de conta no resgate)
    account_id: str | None = Field(
        default=None,
        description="(Opcional) ID da conta se o usuário já estiver logado. Em geral usamos a sessão.",
    )
    create_account: VoucherRedeemCreateAccount | None = Field(
        default=None,
        description="(Opcional) Cria conta e sessão durante o resgate.",
    )

    action: VoucherRedeemAction | None = Field(
        default=None,
        description="Ação de vinculação (NEW_CHILD ou EXISTING_CHILD). Opcional para compatibilidade retroativa.",
    )


class VoucherRedeemResponse(BaseModel):
    """Response após resgate de voucher.

    Mantém compatibilidade com o frontend atual (success/redirect_url).
    """

    success: bool = True
    voucher_id: str
    assets_transferred: int = 0
    child_id: str | None = None
    message: str
    redirect_url: str = "/app/onboarding"

    # Campos adicionais úteis para debug/integração
    discount_cents: int = 0
    delivery_id: str | None = None
    moment_id: str | None = Field(None, description="ID do momento criado com os arquivos importados")
    csrf_token: str | None = Field(
        default=None,
        description="Se uma sessão foi criada durante o resgate, este é o CSRF token pareado a ela.",
    )


class VoucherBulkResponse(BaseModel):
    """Response após criação bulk de vouchers"""
    created_count: int
    vouchers: list[VoucherResponse]


class PaginatedVouchers(BaseModel):
    items: list[VoucherResponse]
    total: int
    next: str | None = None
