from __future__ import annotations

import re
from typing import Final

from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter

from babybook_api.errors import AppError
from babybook_api.settings import settings

_STORAGE: Final[MemoryStorage] = MemoryStorage()
_LIMITER: Final[FixedWindowRateLimiter] = FixedWindowRateLimiter(_STORAGE)


_KEY_SAFE_RE: Final[re.Pattern[str]] = re.compile(r"[^a-zA-Z0-9:_\-.|@]", re.ASCII)


def _sanitize_key(value: str) -> str:
    value = value.strip()
    if not value:
        return "anonymous"
    # Evita chaves com caracteres estranhos (e.g. espaços, quebras de linha)
    return _KEY_SAFE_RE.sub("_", value)


async def enforce_rate_limit(*, bucket: str, limit: str, identity: str) -> None:
    """Aplica rate limit (janela fixa) para um `bucket` e uma `identity`.

    - `bucket`: nome lógico do endpoint/ação (ex.: "auth:login:ip")
    - `limit`: string do limits (ex.: "10/minute")
    - `identity`: identificador (ex.: IP, user_id, email normalizado)

    Observações:
    - O rate limit é desabilitado por padrão (settings.rate_limit_enabled=False)
      para não atrapalhar dev/test.
    - Em produção/staging, habilite via env `RATE_LIMIT_ENABLED=true`.
    """
    if not settings.rate_limit_enabled:
        return

    item = parse(limit)
    key = f"{bucket}:{_sanitize_key(identity)}"
    allowed = _LIMITER.hit(item, key)
    if allowed:
        return

    # 429 é o status canônico para rate limiting.
    raise AppError(
        status_code=429,
        code="rate_limit.exceeded",
        message="Muitas requisições. Tente novamente em instantes.",
    )
