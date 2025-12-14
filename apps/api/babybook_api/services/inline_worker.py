from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import Asset

logger = logging.getLogger(__name__)


async def process_inline_job(session: AsyncSession, *, kind: str, payload: dict) -> None:
    asset_id = payload.get("asset_id")
    if not asset_id:
        logger.warning("Inline job ignorado: payload sem asset_id (%s)", kind)
        return
    asset = await session.get(Asset, uuid.UUID(str(asset_id)))
    if asset is None:
        logger.warning("Inline job ignorado: asset %s nao encontrado", asset_id)
        return
    asset.status = "ready"
    asset.viewer_accessible = True
    # Este processamento simula um job (unidade de trabalho). Persistimos aqui
    # para que o efeito seja observável mesmo fora do escopo do request.
    await session.commit()

