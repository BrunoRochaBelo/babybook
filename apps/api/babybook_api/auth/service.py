from __future__ import annotations

import secrets

from fastapi import Header

from babybook_api.errors import AppError
from babybook_api.settings import settings


async def require_service_auth(
    token: str = Header(..., alias="X-Service-Token"),
) -> None:
    if not secrets.compare_digest(token, settings.service_api_token):
        raise AppError(status_code=401, code="service.unauthorized", message="Token de servico invalido.")
