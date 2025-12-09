"""
Storage Factory - Criação e gerenciamento de providers

Este módulo fornece funções para criar e obter providers de storage
configurados de acordo com o ambiente (local, staging, production).
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from babybook_api.storage.base import StorageProvider, StorageConfig, StorageType
from babybook_api.storage.providers.r2 import R2Provider
from babybook_api.storage.providers.b2 import B2Provider
from babybook_api.storage.providers.minio import MinIOProvider


# Cache de providers inicializados
_providers: dict[str, StorageProvider] = {}


def create_storage_config_from_env() -> dict[StorageType, StorageConfig]:
    """
    Cria configurações de storage a partir de variáveis de ambiente.
    
    Retorna um dicionário com configurações para hot e cold storage.
    """
    from babybook_api.settings import settings
    
    configs: dict[StorageType, StorageConfig] = {}
    
    if settings.app_env == "local":
        # Desenvolvimento local - usa MinIO para tudo
        minio_config = StorageConfig(
            provider="minio",
            bucket=settings.minio_bucket,
            endpoint_url=settings.minio_endpoint,
            access_key_id=settings.minio_access_key,
            secret_access_key=settings.minio_secret_key,
            region="us-east-1",
            public_url_base=settings.minio_public_url,
        )
        configs[StorageType.HOT] = minio_config
        configs[StorageType.COLD] = minio_config
    else:
        # Staging/Production - usa R2 para hot, B2 para cold
        
        # R2 (Cloudflare) - Hot storage
        r2_account_id = settings.cloudflare_account_id or ""
        configs[StorageType.HOT] = StorageConfig(
            provider="r2",
            bucket=settings.r2_bucket or "babybook-hot",
            endpoint_url=f"https://{r2_account_id}.r2.cloudflarestorage.com",
            access_key_id=settings.r2_access_key_id,
            secret_access_key=settings.r2_secret_access_key,
            region="auto",
            account_id=r2_account_id,
            public_url_base=settings.r2_public_url or "https://media.babybook.com.br",
            custom_domain=settings.r2_custom_domain,
        )
        
        # B2 (Backblaze) - Cold storage
        configs[StorageType.COLD] = StorageConfig(
            provider="b2",
            bucket=settings.b2_bucket or "babybook-cold",
            endpoint_url=settings.b2_endpoint,
            access_key_id=settings.b2_access_key_id,
            secret_access_key=settings.b2_secret_access_key,
            region=settings.b2_region,
        )
    
    return configs


def create_provider(config: StorageConfig) -> StorageProvider:
    """
    Cria uma instância de provider baseado na configuração.
    
    Não inicializa o provider - chame await provider.initialize() após criar.
    """
    match config.provider:
        case "r2":
            return R2Provider(config)
        case "b2":
            return B2Provider(config)
        case "minio":
            return MinIOProvider(config)
        case "s3":
            # Fallback para MinIO que é compatível com S3
            return MinIOProvider(config)
        case _:
            raise ValueError(f"Provider desconhecido: {config.provider}")


async def get_storage_provider(
    storage_type: StorageType = StorageType.COLD,
) -> StorageProvider:
    """
    Obtém um provider de storage inicializado.
    
    Args:
        storage_type: Tipo de storage (HOT para R2, COLD para B2)
    
    Returns:
        Provider inicializado e pronto para uso
    """
    cache_key = f"{storage_type.value}"
    
    if cache_key not in _providers:
        configs = create_storage_config_from_env()
        config = configs.get(storage_type)
        
        if config is None:
            raise ValueError(f"Configuração não encontrada para storage type: {storage_type}")
        
        provider = create_provider(config)
        await provider.initialize()
        _providers[cache_key] = provider
    
    return _providers[cache_key]


async def get_hot_storage() -> StorageProvider:
    """Obtém provider de hot storage (R2/MinIO) para previews e thumbnails"""
    return await get_storage_provider(StorageType.HOT)


async def get_cold_storage() -> StorageProvider:
    """Obtém provider de cold storage (B2/MinIO) para originais"""
    return await get_storage_provider(StorageType.COLD)


async def close_all_providers() -> None:
    """Fecha todos os providers. Chamar no shutdown da aplicação."""
    for provider in _providers.values():
        try:
            await provider.close()
        except Exception:
            pass
    _providers.clear()


# ==================== Helpers para decisão de routing ====================

def should_use_hot_storage(
    mime_type: str,
    size_bytes: int,
    is_preview: bool = False,
) -> bool:
    """
    Decide se um asset deve ir para hot storage (R2) ou cold storage (B2).
    
    Hot storage é usado para:
    - Previews e thumbnails (sempre)
    - Imagens pequenas (< 2MB)
    - Assets frequentemente acessados
    
    Cold storage é usado para:
    - Originais de alta resolução
    - Vídeos (qualquer tamanho)
    - Arquivos grandes (> 10MB)
    """
    if is_preview:
        return True
    
    # Vídeos sempre vão para cold
    if mime_type.startswith("video/"):
        return False
    
    # Áudios grandes vão para cold
    if mime_type.startswith("audio/") and size_bytes > 5 * 1024 * 1024:
        return False
    
    # Imagens pequenas podem ficar no hot
    if mime_type.startswith("image/"):
        if size_bytes < 2 * 1024 * 1024:  # < 2MB
            return True
        return False
    
    # Default: cold para segurança de custo
    return False


def get_storage_key_prefix(
    storage_type: StorageType,
    account_id: str,
) -> str:
    """
    Retorna o prefixo de chave apropriado para o tipo de storage.
    
    Hot: accounts/{id}/previews/
    Cold: accounts/{id}/originals/
    """
    if storage_type == StorageType.HOT:
        return f"accounts/{account_id}/previews"
    return f"accounts/{account_id}/originals"
