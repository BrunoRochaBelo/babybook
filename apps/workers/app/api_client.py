from __future__ import annotations

import logging
from typing import Iterable
from uuid import UUID

import httpx

from .settings import get_settings
from .types import VariantData

logger = logging.getLogger(__name__)


async def patch_asset(
    asset_id: UUID,
    *,
    status: str | None = None,
    duration_ms: int | None = None,
    error_code: str | None = None,
    viewer_accessible: bool | None = None,
    key_original: str | None = None,
    variants: Iterable[VariantData] | None = None,
) -> None:
    settings = get_settings()
    body: dict[str, object] = {}
    if status is not None:
        body["status"] = status
    if duration_ms is not None:
        body["duration_ms"] = duration_ms
    if error_code is not None:
        body["error_code"] = error_code
    if viewer_accessible is not None:
        body["viewer_accessible"] = viewer_accessible
    if key_original is not None:
        body["key_original"] = key_original
    if variants is not None:
        body["variants"] = [variant.to_payload() for variant in variants]
    if not body:
        return
    async with httpx.AsyncClient(base_url=settings.api_base_url, timeout=10.0) as client:
        response = await client.patch(
            f"/assets/{asset_id}",
            json=body,
            headers={"X-Service-Token": settings.service_api_token},
        )
        try:
            response.raise_for_status()
        except httpx.HTTPError:
            logger.exception("Falha ao atualizar asset %s na API", asset_id)
            raise

