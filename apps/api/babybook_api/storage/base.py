"""
Base classes e interfaces para Storage Providers
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Literal


class StorageType(str, Enum):
    """Tipo de storage (hot para acesso frequente, cold para arquivamento)"""
    HOT = "hot"   # R2 - thumbnails, previews, assets frequentes
    COLD = "cold"  # R2 - originais, vídeos, arquivos grandes (arquivamento lógico)


@dataclass
class StorageConfig:
    """Configuração de um provider de storage"""
    provider: Literal["r2", "minio", "s3"]
    bucket: str
    endpoint_url: str | None = None
    access_key_id: str | None = None
    secret_access_key: str | None = None
    region: str = "auto"
    public_url_base: str | None = None
    
    # Configurações específicas
    account_id: str | None = None  # Para R2
    custom_domain: str | None = None
    
    # Lifecycle
    default_ttl_days: int | None = None
    
    def __post_init__(self) -> None:
        if not self.bucket:
            raise ValueError("bucket é obrigatório")


@dataclass
class PresignedUrlResult:
    """Resultado de uma URL pré-assinada"""
    url: str
    method: Literal["GET", "PUT", "DELETE"]
    expires_at: datetime
    headers: dict[str, str] = field(default_factory=dict)
    
    # Para multipart
    upload_id: str | None = None
    part_number: int | None = None


@dataclass
class UploadPartInfo:
    """Informações de uma parte de upload multipart"""
    part_number: int
    url: str
    headers: dict[str, str] = field(default_factory=dict)


@dataclass
class MultipartUploadResult:
    """Resultado da inicialização de upload multipart"""
    upload_id: str
    key: str
    parts: list[UploadPartInfo]
    expires_at: datetime


@dataclass
class ObjectInfo:
    """Metadados de um objeto no storage"""
    key: str
    size: int
    etag: str | None = None
    content_type: str | None = None
    last_modified: datetime | None = None
    metadata: dict[str, str] = field(default_factory=dict)


class StorageProvider(ABC):
    """
    Interface abstrata para providers de storage S3-compatível.
    
    Implementações:
    - R2Provider (Cloudflare R2)
    - MinIOProvider (desenvolvimento local)
    """
    
    def __init__(self, config: StorageConfig) -> None:
        self.config = config
        self._client: Any = None
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Nome do provider para logging"""
        ...
    
    @abstractmethod
    async def initialize(self) -> None:
        """Inicializa conexão com o provider"""
        ...
    
    @abstractmethod
    async def close(self) -> None:
        """Fecha conexão com o provider"""
        ...
    
    # ==================== Operações de Leitura ====================
    
    @abstractmethod
    async def get_object(self, key: str) -> bytes:
        """Baixa um objeto do storage"""
        ...
    
    @abstractmethod
    async def get_object_info(self, key: str) -> ObjectInfo | None:
        """Obtém metadados de um objeto (HEAD)"""
        ...
    
    @abstractmethod
    async def object_exists(self, key: str) -> bool:
        """Verifica se um objeto existe"""
        ...
    
    @abstractmethod
    async def list_objects(
        self,
        prefix: str,
        max_keys: int = 1000,
        continuation_token: str | None = None,
    ) -> tuple[list[ObjectInfo], str | None]:
        """Lista objetos com um prefixo"""
        ...
    
    # ==================== Operações de Escrita ====================
    
    @abstractmethod
    async def put_object(
        self,
        key: str,
        data: bytes,
        content_type: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> ObjectInfo:
        """Upload direto de um objeto pequeno"""
        ...
    
    @abstractmethod
    async def delete_object(self, key: str) -> bool:
        """Remove um objeto"""
        ...
    
    @abstractmethod
    async def delete_objects(self, keys: list[str]) -> list[str]:
        """Remove múltiplos objetos, retorna lista de keys com erro"""
        ...
    
    @abstractmethod
    async def copy_object(
        self,
        source_key: str,
        dest_key: str,
        dest_bucket: str | None = None,
    ) -> ObjectInfo:
        """Copia um objeto dentro do mesmo bucket ou para outro"""
        ...
    
    # ==================== URLs Pré-assinadas ====================
    
    @abstractmethod
    async def generate_presigned_get_url(
        self,
        key: str,
        expires_in: timedelta = timedelta(hours=1),
        response_content_type: str | None = None,
        response_content_disposition: str | None = None,
    ) -> PresignedUrlResult:
        """Gera URL pré-assinada para download"""
        ...
    
    @abstractmethod
    async def generate_presigned_put_url(
        self,
        key: str,
        expires_in: timedelta = timedelta(hours=1),
        content_type: str | None = None,
        content_length_range: tuple[int, int] | None = None,
        metadata: dict[str, str] | None = None,
    ) -> PresignedUrlResult:
        """Gera URL pré-assinada para upload direto"""
        ...
    
    # ==================== Upload Multipart ====================
    
    @abstractmethod
    async def create_multipart_upload(
        self,
        key: str,
        content_type: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Inicia um upload multipart, retorna upload_id"""
        ...
    
    @abstractmethod
    async def generate_presigned_part_urls(
        self,
        key: str,
        upload_id: str,
        part_count: int,
        expires_in: timedelta = timedelta(hours=1),
    ) -> list[UploadPartInfo]:
        """Gera URLs pré-assinadas para cada parte do upload"""
        ...
    
    @abstractmethod
    async def complete_multipart_upload(
        self,
        key: str,
        upload_id: str,
        parts: list[dict[str, Any]],  # [{"PartNumber": 1, "ETag": "..."}]
    ) -> ObjectInfo:
        """Finaliza upload multipart"""
        ...
    
    @abstractmethod
    async def abort_multipart_upload(self, key: str, upload_id: str) -> None:
        """Cancela upload multipart"""
        ...
    
    # ==================== Helpers ====================
    
    def get_public_url(self, key: str) -> str | None:
        """Retorna URL pública se o bucket for público"""
        if self.config.public_url_base:
            return f"{self.config.public_url_base.rstrip('/')}/{key}"
        return None
    
    def get_key_for_asset(
        self,
        account_id: str,
        asset_id: str,
        filename: str,
        prefix: str = "uploads",
    ) -> str:
        """Gera chave padronizada para um asset"""
        return f"accounts/{account_id}/{prefix}/{asset_id}/{filename}"
    
    def get_key_for_preview(
        self,
        account_id: str,
        asset_id: str,
        variant: str = "thumb",
    ) -> str:
        """Gera chave para preview/thumbnail"""
        return f"accounts/{account_id}/previews/{asset_id}/{variant}"
