"""
Partner Portal Schemas

Pydantic models for Partner Portal API requests and responses.
"""

from datetime import datetime
from typing import Optional, Any, Literal
from pydantic import BaseModel, Field, EmailStr


# =============================================================================
# Onboarding
# =============================================================================

class PartnerOnboardingRequest(BaseModel):
    """Request para cadastro de novo parceiro."""
    name: str = Field(..., min_length=2, max_length=200, description="Nome do fotógrafo")
    email: EmailStr = Field(..., description="E-mail para login")
    password: str = Field(..., min_length=8, description="Senha de acesso")
    studio_name: Optional[str] = Field(None, max_length=200, description="Nome do estúdio")
    phone: Optional[str] = Field(None, max_length=32, description="Telefone para contato")


class PartnerOnboardingResponse(BaseModel):
    """Response do cadastro de parceiro."""
    success: bool
    message: str
    partner_id: str
    status: str


# =============================================================================
# Profile & Dashboard
# =============================================================================

class PartnerProfileResponse(BaseModel):
    """Perfil do parceiro."""
    id: str
    name: str
    email: str
    studio_name: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    voucher_balance: int
    status: str
    created_at: datetime


class PartnerProfileUpdateRequest(BaseModel):
    """Request para atualizar perfil do parceiro."""
    name: Optional[str] = Field(None, min_length=2, max_length=200, description="Nome do fotógrafo")
    studio_name: Optional[str] = Field(None, max_length=200, description="Nome do estúdio")
    phone: Optional[str] = Field(None, max_length=32, description="Telefone para contato")
    logo_url: Optional[str] = Field(None, description="URL do logo do estúdio")


class PartnerDashboardStatsResponse(BaseModel):
    """Estatísticas do dashboard do parceiro."""
    voucher_balance: int = Field(..., description="Créditos disponíveis")
    reserved_credits: int = Field(0, description="Créditos reservados/em trânsito (entregas com crédito reservado)")
    total_deliveries: int = Field(..., description="Total de entregas")
    ready_deliveries: int = Field(..., description="Entregas prontas para resgate")
    delivered_deliveries: int = Field(..., description="Entregas resgatadas")
    total_vouchers: int = Field(..., description="Total de vouchers gerados")
    redeemed_vouchers: int = Field(..., description="Vouchers resgatados")
    pending_vouchers: int = Field(..., description="Vouchers pendentes")
    total_assets: int = Field(..., description="Total de arquivos enviados")


# =============================================================================
# Credit Packages
# =============================================================================

class CreditPackage(BaseModel):
    """Pacote de créditos para compra."""
    id: str
    name: str
    voucher_count: int = Field(..., description="Quantidade de vouchers")
    # Nota: price_cents é o preço do cartão (condição padrão no gateway).
    # Quando existir incentivo ao PIX, o frontend pode exibir pix_price_cents.
    price_cents: int = Field(..., description="Preço em centavos (BRL) no cartão")
    pix_price_cents: Optional[int] = Field(
        None,
        description="Preço em centavos (BRL) no PIX (à vista). Se ausente, o frontend pode aplicar fallback.",
    )
    unit_price_cents: int = Field(..., description="Preço por unidade em centavos")
    savings_percent: int = Field(0, description="Percentual de economia")
    is_popular: bool = Field(False, description="Destaque como mais popular")


PaymentMethod = Literal["pix", "card"]


class PurchaseCreditsRequest(BaseModel):
    """Request para compra de créditos."""
    package_id: str = Field(..., description="ID do pacote a comprar")
    payment_method: PaymentMethod = Field(
        "card",
        description="Forma de pagamento. 'pix' (à vista) ou 'card' (cartão, com parcelamento no checkout).",
    )


class PurchaseCreditsResponse(BaseModel):
    """Response da compra de créditos."""
    checkout_id: str
    checkout_url: str
    package: CreditPackage
    payment_method: PaymentMethod
    amount_cents: int = Field(..., description="Valor a pagar, em centavos (BRL), para o método selecionado")
    max_installments_no_interest: int = Field(
        3,
        description="Máximo de parcelas sem juros (quando payment_method='card')",
    )
    expires_at: datetime


# =============================================================================
# Check Access (verificação de acesso do cliente)
# =============================================================================

class CheckAccessRequest(BaseModel):
    """Request para verificar se cliente já tem acesso ao Baby Book."""
    email: EmailStr = Field(..., description="E-mail do responsável")


class ChildInfo(BaseModel):
    """Informações de um filho/conta do cliente."""
    id: str
    name: str
    has_access: bool = True  # Se tem Baby Book ativo


class CheckAccessResponse(BaseModel):
    """Response da verificação de acesso."""
    has_access: bool = Field(..., description="Se o cliente já tem acesso ao Baby Book")
    email: str
    client_name: Optional[str] = None
    children: list[ChildInfo] = Field(default_factory=list, description="Filhos com Baby Book")
    message: str = Field(..., description="Mensagem para exibir no frontend")


# =============================================================================
# Deliveries
# =============================================================================

class CreateDeliveryRequest(BaseModel):
    """Request para criar nova entrega."""
    client_name: str = Field(..., min_length=2, max_length=200, description="Nome do responsável")
    client_email: Optional[EmailStr] = Field(None, description="E-mail do responsável (para verificar acesso)")
    child_name: Optional[str] = Field(None, max_length=200, description="Nome da criança")
    title: Optional[str] = Field(None, max_length=200, description="Título da entrega")
    description: Optional[str] = Field(None, description="Descrição opcional")
    event_date: Optional[datetime] = Field(None, description="Data do evento (parto, ensaio, etc)")


class DeliveryResponse(BaseModel):
    """Response de uma entrega."""
    id: str
    title: str
    client_name: Optional[str] = None
    status: str
    credit_status: Optional[Literal["reserved", "consumed", "refunded"]] = Field(
        None,
        description="Status do crédito desta entrega (Golden Record: reserved/consumed/refunded)",
    )
    is_archived: bool = Field(False, description="Se a entrega está arquivada (soft delete do fotógrafo)")
    archived_at: Optional[datetime] = Field(None, description="Quando foi arquivada (se aplicável)")
    assets_count: int
    voucher_code: Optional[str] = None
    created_at: datetime
    redeemed_at: Optional[datetime] = None
    redeemed_by: Optional[str] = None


class DeliveryAggregationsResponse(BaseModel):
    """Agregações para o painel de listagem."""
    total: int = Field(..., description="Total de entregas (inclui arquivadas)")
    archived: int = Field(..., description="Total de entregas arquivadas")
    by_status: dict[str, int] = Field(
        default_factory=dict,
        description="Contagem de entregas ativas (não arquivadas) por status",
    )


class DeliveryListResponse(BaseModel):
    """Lista de entregas."""
    deliveries: list[DeliveryResponse]
    total: int
    aggregations: Optional[DeliveryAggregationsResponse] = None


class DeliveryAssetInfo(BaseModel):
    """Informações de um arquivo na entrega."""
    upload_id: str
    key: str
    filename: str
    content_type: str
    size_bytes: int
    uploaded_at: str


class DeliveryDetailResponse(BaseModel):
    """Detalhes completos de uma entrega."""
    id: str
    title: str
    client_name: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    status: str
    credit_status: Optional[Literal["reserved", "consumed", "refunded"]] = Field(
        None,
        description="Status do crédito desta entrega (Golden Record: reserved/consumed/refunded)",
    )
    is_archived: bool = Field(False, description="Se a entrega está arquivada (soft delete do fotógrafo)")
    archived_at: Optional[datetime] = Field(None, description="Quando foi arquivada (se aplicável)")
    assets_count: int
    assets: list[dict] = Field(default_factory=list)
    voucher_code: Optional[str] = None
    created_at: datetime
    redeemed_at: Optional[datetime] = None
    redeemed_by: Optional[str] = None


# =============================================================================
# Upload
# =============================================================================

# Limite de 100MB por arquivo (100 * 1024 * 1024)
MAX_UPLOAD_SIZE_BYTES = 104_857_600

# Content types permitidos para upload
ALLOWED_CONTENT_TYPES = {
    # Imagens
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    # Vídeos
    "video/mp4",
    "video/quicktime",
    "video/webm",
}


class UploadInitRequest(BaseModel):
    """Request para iniciar upload de arquivo."""
    filename: str = Field(
        ..., 
        min_length=1, 
        max_length=255, 
        description="Nome do arquivo (será sanitizado)"
    )
    content_type: str = Field(..., description="MIME type do arquivo")
    size_bytes: int = Field(
        ..., 
        gt=0, 
        le=MAX_UPLOAD_SIZE_BYTES, 
        description=f"Tamanho em bytes (máx {MAX_UPLOAD_SIZE_BYTES // 1024 // 1024}MB)"
    )

    @property
    def is_valid_content_type(self) -> bool:
        """Verifica se o content_type é permitido."""
        return self.content_type in ALLOWED_CONTENT_TYPES
    
    @property
    def sanitized_filename(self) -> str:
        """Retorna filename sanitizado (remove caracteres perigosos)."""
        import re
        # Remove caracteres perigosos, mantém apenas alfanuméricos, -, _, .
        name = re.sub(r'[^\w\-\.]', '_', self.filename)
        # Remove múltiplos underscores consecutivos
        name = re.sub(r'_+', '_', name)
        # Limita tamanho
        return name[:200] if len(name) > 200 else name


class UploadInitResponse(BaseModel):
    """Response com URL para upload direto."""
    upload_id: str
    upload_url: str = Field(..., description="URL presigned para PUT do arquivo")
    key: str = Field(..., description="Key do arquivo no storage")
    expires_at: datetime


class UploadCompleteRequest(BaseModel):
    """Request para confirmar upload concluído."""
    upload_id: str = Field(..., min_length=1, max_length=100)
    key: str = Field(..., min_length=1, max_length=500)
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., max_length=100)
    size_bytes: int = Field(..., gt=0, le=MAX_UPLOAD_SIZE_BYTES)


# =============================================================================
# Voucher Card
# =============================================================================

class GenerateVoucherCardRequest(BaseModel):
    """Request para finalizar entrega e gerar voucher."""
    beneficiary_name: Optional[str] = Field(None, description="Nome do beneficiário para o cartão")
    message: Optional[str] = Field(None, max_length=500, description="Mensagem personalizada")
    voucher_prefix: Optional[str] = Field(None, max_length=8, description="Prefixo do código")
    expires_days: Optional[int] = Field(365, ge=30, le=730, description="Dias até expirar")


class VoucherCardResponse(BaseModel):
    """Dados para gerar o cartão digital no frontend."""
    voucher_code: str
    redeem_url: str
    qr_data: str = Field(..., description="Dados para gerar QR Code")
    studio_name: str
    studio_logo_url: Optional[str] = None
    beneficiary_name: Optional[str] = None
    message: str
    assets_count: int
    expires_at: Optional[datetime] = None
