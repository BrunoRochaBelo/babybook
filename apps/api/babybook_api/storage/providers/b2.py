"""Módulo legado (Backblaze B2).

O Baby Book migrou para **R2-only**. Este arquivo é mantido apenas para evitar
importações acidentais em branches antigos e para dar uma mensagem clara caso
alguém tente usar o provider antigo.

Não existe implementação funcional de B2 aqui.
"""

from __future__ import annotations


class B2Provider:  # pragma: no cover
    """Stub do provider legado.

    Mantém compatibilidade de import (ex.: `from ...b2 import B2Provider`) sem
    quebrar o app em import-time. Qualquer tentativa de instanciar/usar falha
    explicitamente.
    """

    def __init__(self, *args, **kwargs) -> None:
        raise RuntimeError(
            "Storage provider legado removido. O sistema é R2-only; use R2Provider."
        )


def __getattr__(name: str):  # pragma: no cover
    raise AttributeError(
        "Storage provider legado removido. O sistema é R2-only; use R2Provider."
    )


__all__ = ["B2Provider"]
