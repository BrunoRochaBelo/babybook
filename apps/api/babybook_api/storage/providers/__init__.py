"""
Storage Providers - Implementações específicas
"""
from .minio import MinIOProvider
from .r2 import R2Provider

__all__ = ["R2Provider", "MinIOProvider"]
