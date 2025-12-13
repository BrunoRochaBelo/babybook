"""
Storage Providers - Implementações específicas
"""
from .r2 import R2Provider
from .minio import MinIOProvider

__all__ = ["R2Provider", "MinIOProvider"]
