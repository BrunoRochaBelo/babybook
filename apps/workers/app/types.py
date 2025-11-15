from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any


def _parse_uuid(raw: Any, field: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(raw))
    except Exception as exc:  # pragma: no cover - sanitiza erro
        raise ValueError(f"Campo {field} invalido no payload do job") from exc


def log_prefix(trace_id: str | None) -> str:
    return f"[{trace_id}] " if trace_id else ""


@dataclass(slots=True)
class AssetJobPayload:
    asset_id: uuid.UUID
    account_id: uuid.UUID
    key: str
    kind: str
    trace_id: str | None
    mime: str | None
    scope: str | None

    @classmethod
    def parse(cls, payload: dict[str, Any], metadata: dict[str, Any]) -> "AssetJobPayload":
        asset_id = _parse_uuid(payload.get("asset_id"), "asset_id")
        account_id = _parse_uuid(payload.get("account_id"), "account_id")
        key = payload.get("key")
        if not key:
            raise ValueError("Payload sem chave do objeto (key)")
        kind = payload.get("kind") or "photo"
        return cls(
            asset_id=asset_id,
            account_id=account_id,
            key=key,
            kind=kind,
            trace_id=metadata.get("trace_id"),
            mime=payload.get("mime"),
            scope=payload.get("scope"),
        )


@dataclass(slots=True)
class ExportItem:
    key: str
    filename: str


@dataclass(slots=True)
class ExportJobPayload:
    export_id: uuid.UUID
    account_id: uuid.UUID
    items: list[ExportItem]
    trace_id: str | None

    @classmethod
    def parse(cls, payload: dict[str, Any], metadata: dict[str, Any]) -> "ExportJobPayload":
        export_id = _parse_uuid(payload.get("export_id"), "export_id")
        account_id = _parse_uuid(payload.get("account_id"), "account_id")
        raw_items = payload.get("items") or []
        items: list[ExportItem] = []
        for item in raw_items:
            key = item.get("key")
            if not key:
                continue
            filename = item.get("filename") or key.split("/")[-1]
            items.append(ExportItem(key=key, filename=filename))
        if not items:
            raise ValueError("Export job sem itens para empacotar")
        return cls(
            export_id=export_id,
            account_id=account_id,
            items=items,
            trace_id=metadata.get("trace_id"),
        )


@dataclass(slots=True)
class VariantData:
    preset: str
    key: str
    size_bytes: int
    kind: str
    width_px: int | None = None
    height_px: int | None = None

    def to_payload(self) -> dict[str, Any]:
        return {
            "preset": self.preset,
            "key": self.key,
            "size_bytes": self.size_bytes,
            "kind": self.kind,
            "width_px": self.width_px,
            "height_px": self.height_px,
        }
