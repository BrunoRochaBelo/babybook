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

from .base import PresignedUrlResult, StorageConfig, StorageProvider, StorageType
from .factory import get_cold_storage, get_hot_storage, get_storage_provider
from .hybrid_service import (
    AssetLocation,
    HybridStorageService,
    UploadTarget,
    get_hybrid_storage,
)
from .partner_service import (
    CopyResult,
    DeliveryAsset,
    PartnerStorageService,
    PartnerUploadTarget,
    get_partner_storage,
)
from .paths import (
    LifecycleRule,
    PathPrefix,
    # Classes e tipos
    StoragePath,
    TmpSubfolder,
    # Utilidades de cópia
    get_copy_destination,
    # Lifecycle
    get_lifecycle_rules,
    list_partner_delivery_prefix,
    list_user_moment_prefix,
    # Geradores de path - Parceiros
    partner_delivery_path,
    partner_thumb_path,
    require_uuid,
    # Funções de segurança
    secure_filename,
    # Geradores de path - Sistema
    system_default_path,
    tmp_processing_path,
    # Geradores de path - Temporários
    tmp_upload_path,
    # Geradores de path - Usuários
    user_avatar_path,
    user_child_path,
    user_moment_path,
    user_preview_path,
    user_thumb_path,
    user_vault_path,
    validate_partner_access,
    # Validação de acesso
    validate_user_access,
    validate_uuid,
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
