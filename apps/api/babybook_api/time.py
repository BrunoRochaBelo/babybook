from __future__ import annotations

from datetime import datetime, timezone


def utcnow() -> datetime:
    """Retorna o 'agora' em UTC com timezone (offset-aware).

    Preferir este helper ao invés de `datetime.utcnow()` para evitar comparações
    entre datetimes naive vs aware quando colunas usam `DateTime(timezone=True)`.
    """

    return datetime.now(timezone.utc)


def _coerce_utc(dt: datetime) -> datetime:
    """Normaliza um datetime para UTC offset-aware.

    - Se `dt` vier naive (sem tzinfo), assumimos que já está em UTC.
    - Se `dt` vier aware, convertemos para UTC.
    """

    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def is_before(a: datetime, b: datetime) -> bool:
    """Comparação segura entre datetimes (naive/aware), padronizando em UTC."""

    return _coerce_utc(a) < _coerce_utc(b)


def is_expired(expires_at: datetime | None, *, now: datetime | None = None) -> bool:
    """Retorna True se `expires_at` já passou (comparação segura)."""

    if expires_at is None:
        return False
    if now is None:
        now = utcnow()
    return is_before(expires_at, now)
