from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class FileSignatureResult:
    declared_content_type: str
    detected_content_types: tuple[str, ...]


def _is_jpeg(header: bytes) -> bool:
    return len(header) >= 3 and header[0:3] == b"\xFF\xD8\xFF"


def _is_png(header: bytes) -> bool:
    return len(header) >= 8 and header[0:8] == b"\x89PNG\r\n\x1a\n"


def _is_gif(header: bytes) -> bool:
    return len(header) >= 6 and header[0:6] in (b"GIF87a", b"GIF89a")


def _is_webp(header: bytes) -> bool:
    return len(header) >= 12 and header[0:4] == b"RIFF" and header[8:12] == b"WEBP"


def _is_ebml(header: bytes) -> bool:
    return len(header) >= 4 and header[0:4] == b"\x1A\x45\xDF\xA3"


def _brand_from_ftyp(header: bytes) -> str | None:
    if len(header) < 12:
        return None
    if header[4:8] != b"ftyp":
        return None
    try:
        return header[8:12].decode("ascii", errors="ignore")
    except Exception:
        return None


def detect_content_types_from_header(header: bytes) -> tuple[str, ...]:
    detected: list[str] = []

    if _is_jpeg(header):
        detected.append("image/jpeg")
    if _is_png(header):
        detected.append("image/png")
    if _is_gif(header):
        detected.append("image/gif")
    if _is_webp(header):
        detected.append("image/webp")

    brand = _brand_from_ftyp(header)
    if brand:
        if brand in {"heic", "heix", "hevc", "hevx", "mif1", "msf1"}:
            detected.append("image/heic")
            detected.append("image/heif")
        if brand == "qt  ":
            detected.append("video/quicktime")
        if brand in {"isom", "iso2", "mp41", "mp42", "avc1"}:
            detected.append("video/mp4")

    if _is_ebml(header):
        detected.append("video/webm")

    seen: set[str] = set()
    uniq = [ct for ct in detected if not (ct in seen or seen.add(ct))]
    return tuple(uniq)


def validate_magic_bytes(*, declared_content_type: str, header: bytes) -> FileSignatureResult:
    declared = (declared_content_type or "").strip().lower()
    if not declared:
        raise ValueError("content_type ausente")

    detected = detect_content_types_from_header(header)
    if not detected:
        raise ValueError("assinatura do arquivo desconhecida")

    if declared not in detected:
        raise ValueError("assinatura do arquivo não corresponde ao content_type")

    return FileSignatureResult(declared_content_type=declared, detected_content_types=detected)


def validate_file_on_disk(*, path: Path, declared_content_type: str, header_bytes: int = 512) -> FileSignatureResult:
    with path.open("rb") as f:
        header = f.read(header_bytes)
    return validate_magic_bytes(declared_content_type=declared_content_type, header=header)


def validate_file_prefix_on_disk(
    *,
    path: Path,
    allowed_prefixes: tuple[str, ...],
    header_bytes: int = 512,
) -> tuple[str, ...]:
    """Valida se o arquivo aparenta ser de um tipo compatível com algum prefixo.

    Ex.: allowed_prefixes=("image/",) ou ("video/",).
    Retorna os content-types detectados.
    """
    with path.open("rb") as f:
        header = f.read(header_bytes)
    detected = detect_content_types_from_header(header)
    if not detected:
        raise ValueError("assinatura do arquivo desconhecida")
    if not any(any(ct.startswith(prefix) for prefix in allowed_prefixes) for ct in detected):
        raise ValueError("assinatura do arquivo não corresponde ao tipo esperado")
    return detected
