"""
Storage Layer - Baby Book

Abstração de storage para suportar múltiplos providers:
- Cloudflare R2 (hot storage - thumbnails, previews)
- MinIO (desenvolvimento local)

Estrutura de Pastas:
├── tmp/           <-- Temporários (lifecycle: 1 dia)
├── partners/      <-- B2B2C (lifecycle: 365 dias)
├── u/             <-- Usuários (permanente)
└── sys/           <-- Sistema

@see docs/PLANO_ATUALIZACAO_ADAPTACAO_MONOREPO.md - Fase 4
"""
from __future__ import annotations

from .base import StorageProvider, StorageConfig, StorageType, PresignedUrlResult
from .factory import get_storage_provider, get_hot_storage, get_cold_storage
from .paths import (
    # Classes e tipos
    StoragePath,
    PathPrefix,
    TmpSubfolder,
    LifecycleRule,
    # Funções de segurança
    secure_filename,
    validate_uuid,
    require_uuid,
    # Geradores de path - Temporários
    tmp_upload_path,
    tmp_processing_path,
    # Geradores de path - Parceiros
    partner_delivery_path,
    partner_thumb_path,
    # Geradores de path - Usuários
    user_avatar_path,
    user_moment_path,
    user_thumb_path,
    user_preview_path,
    user_vault_path,
    user_child_path,
    # Geradores de path - Sistema
    system_default_path,
    # Utilidades de cópia
    get_copy_destination,
    list_partner_delivery_prefix,
    list_user_moment_prefix,
    # Validação de acesso
    validate_user_access,
    validate_partner_access,
    # Lifecycle
    get_lifecycle_rules,
)
from .partner_service import (
    PartnerStorageService,
    PartnerUploadTarget,
    DeliveryAsset,
    CopyResult,
    get_partner_storage,
)
from .hybrid_service import (
    HybridStorageService,
    UploadTarget,
    AssetLocation,
    get_hybrid_storage,
)

__all__ = [
    # Classes base
    "StorageProvider",
    "StorageConfig",
    "StorageType",
    "PresignedUrlResult",
    # Factory
    "get_storage_provider",
    "get_hot_storage",
    "get_cold_storage",
    # Paths
    "StoragePath",
    "PathPrefix",
    "TmpSubfolder",
    "LifecycleRule",
    "secure_filename",
    "validate_uuid",
    "require_uuid",
    "tmp_upload_path",
    "tmp_processing_path",
    "partner_delivery_path",
    "partner_thumb_path",
    "user_avatar_path",
    "user_moment_path",
    "user_thumb_path",
    "user_preview_path",
    "user_vault_path",
    "user_child_path",
    "system_default_path",
    "get_copy_destination",
    "list_partner_delivery_prefix",
    "list_user_moment_prefix",
    "validate_user_access",
    "validate_partner_access",
    "get_lifecycle_rules",
    # Partner Service
    "PartnerStorageService",
    "PartnerUploadTarget",
    "DeliveryAsset",
    "CopyResult",
    "get_partner_storage",
    # Hybrid Service
    "HybridStorageService",
    "UploadTarget",
    "AssetLocation",
    "get_hybrid_storage",
]
