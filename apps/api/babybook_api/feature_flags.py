"""
Feature Flags Module

Centralized feature flag management for controlled rollout of new features.
Flags are configured via environment variables for easy toggling per environment.

Usage:
    from babybook_api.feature_flags import flags, require_feature

    # Check flag value
    if flags.voucher_b2b2c:
        # B2B2C code path

    # Use as route decorator
    @router.post("/vouchers/redeem")
    @require_feature("voucher_b2b2c")
    async def redeem_voucher(...):
        ...

    # Use as dependency
    @router.get("/partners")
    async def list_partners(
        _: None = Depends(feature_required("voucher_b2b2c"))
    ):
        ...

Environment Variables:
    FEATURE_VOUCHER_B2B2C=true       # Partner portal, vouchers, deliveries
    FEATURE_CLIENT_TRANSCODE=true    # ffmpeg.wasm client-side processing
    FEATURE_EDGE_FILE_PROTECTION=true # Edge Worker file protection
    FEATURE_PIX_PAYMENT=false        # PIX payment method (in development)
"""

from functools import wraps
from typing import Callable, Literal

from fastapi import HTTPException, status

from babybook_api.settings import settings


# =============================================================================
# Feature Flag Names (Type-safe)
# =============================================================================

FeatureFlagName = Literal[
    "voucher_b2b2c",
    "client_transcode",
    "edge_file_protection",
    "pix_payment",
]


# =============================================================================
# Feature Flags Class
# =============================================================================


class FeatureFlags:
    """
    Provides access to feature flags from settings.
    
    All flags are read-only and sourced from environment variables.
    """

    @property
    def voucher_b2b2c(self) -> bool:
        """B2B2C Partner Portal - vouchers, deliveries, partner accounts."""
        return settings.feature_voucher_b2b2c

    @property
    def client_transcode(self) -> bool:
        """Client-side transcoding with ffmpeg.wasm."""
        return settings.feature_client_transcode

    @property
    def edge_file_protection(self) -> bool:
        """Edge Worker file protection ('Porteiro Digital')."""
        return settings.feature_edge_file_protection

    @property
    def pix_payment(self) -> bool:
        """PIX payment method."""
        return settings.feature_pix_payment

    def is_enabled(self, flag_name: FeatureFlagName) -> bool:
        """Check if a feature flag is enabled by name."""
        return getattr(self, flag_name, False)

    def all_flags(self) -> dict[str, bool]:
        """Return all feature flags as a dictionary."""
        return {
            "voucher_b2b2c": self.voucher_b2b2c,
            "client_transcode": self.client_transcode,
            "edge_file_protection": self.edge_file_protection,
            "pix_payment": self.pix_payment,
        }


# Singleton instance
flags = FeatureFlags()


# =============================================================================
# Decorators and Dependencies
# =============================================================================


def require_feature(flag_name: FeatureFlagName) -> Callable:
    """
    Decorator that returns 404 if a feature flag is disabled.
    
    This makes the endpoint "disappear" when the feature is off,
    which is cleaner than returning a 403 Forbidden.
    
    Usage:
        @router.post("/vouchers/redeem")
        @require_feature("voucher_b2b2c")
        async def redeem_voucher(...):
            ...
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not flags.is_enabled(flag_name):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Not found",
                )
            return await func(*args, **kwargs)

        return wrapper

    return decorator


def feature_required(flag_name: FeatureFlagName):
    """
    FastAPI dependency that checks if a feature is enabled.
    
    Usage:
        @router.get("/partners")
        async def list_partners(
            _: None = Depends(feature_required("voucher_b2b2c"))
        ):
            ...
    """

    async def dependency():
        if not flags.is_enabled(flag_name):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found",
            )

    return dependency


# =============================================================================
# API Endpoint for Flag Status (Admin/Debug)
# =============================================================================


def get_flags_status() -> dict:
    """
    Returns the current status of all feature flags.
    
    Used by admin endpoints and health checks.
    """
    return {
        "feature_flags": flags.all_flags(),
        "environment": settings.app_env,
    }
