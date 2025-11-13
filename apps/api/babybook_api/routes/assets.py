from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.service import require_service_auth
from babybook_api.db.models import Asset, AssetVariant
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.assets import AssetStatusUpdate

router = APIRouter()


async def _get_asset(db: AsyncSession, asset_id: uuid.UUID) -> Asset:
    stmt = select(Asset).where(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()
    if asset is None:
        raise AppError(status_code=404, code="asset.not_found", message="Asset nao encontrado.")
    return asset


@router.patch("/assets/{asset_id}", summary="Atualiza status e variantes de um asset")
async def patch_asset(
    asset_id: uuid.UUID,
    payload: AssetStatusUpdate,
    _: None = Depends(require_service_auth),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str | None]:
    asset = await _get_asset(db, asset_id)
    if payload.status is not None:
        asset.status = payload.status
    if payload.duration_ms is not None:
        asset.duration_ms = payload.duration_ms
    if payload.error_code is not None:
        asset.error_code = payload.error_code
    if payload.viewer_accessible is not None:
        asset.viewer_accessible = payload.viewer_accessible
    if payload.variants is not None:
        asset.variants.clear()
        for variant in payload.variants:
            asset.variants.append(
                AssetVariant(
                    preset=variant.preset,
                    key=variant.key,
                    size_bytes=variant.size_bytes,
                    width_px=variant.width_px,
                    height_px=variant.height_px,
                    vtype=variant.kind,
                )
            )
    await db.flush()
    await db.commit()
    return {"id": str(asset.id), "status": asset.status}
