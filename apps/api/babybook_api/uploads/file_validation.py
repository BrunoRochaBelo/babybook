from __future__ import annotations

from dataclasses import dataclass


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
    # RIFF....WEBP
    return len(header) >= 12 and header[0:4] == b"RIFF" and header[8:12] == b"WEBP"


def _is_ebml(header: bytes) -> bool:
    # EBML header (usado por WebM/Matroska)
    return len(header) >= 4 and header[0:4] == b"\x1A\x45\xDF\xA3"


def _brand_from_ftyp(header: bytes) -> str | None:
    # ISO BMFF / QuickTime:
    # 0..3: size
    # 4..7: 'ftyp'
    # 8..11: major_brand
    if len(header) < 12:
        return None
    if header[4:8] != b"ftyp":
        return None
    try:
        return header[8:12].decode("ascii", errors="ignore")
    except Exception:
        return None


def detect_content_types_from_header(header: bytes) -> tuple[str, ...]:
    """Retorna possíveis content-types baseados em 'magic bytes'.

    Observações:
    - A detecção aqui é propositalmente conservadora.
    - Para formatos baseados em ISO-BMFF (ftyp), usamos o major_brand.
    """
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
        # HEIF/HEIC (variações mais comuns)
        if brand in {"heic", "heix", "hevc", "hevx", "mif1", "msf1"}:
            detected.append("image/heic")
            detected.append("image/heif")
        # QuickTime
        if brand == "qt  ":
            detected.append("video/quicktime")
        # MP4
        if brand in {"isom", "iso2", "mp41", "mp42", "avc1"}:
            detected.append("video/mp4")

    # WebM (EBML)
    if _is_ebml(header):
        detected.append("video/webm")

    # Dedup preservando ordem
    seen: set[str] = set()
    uniq = [ct for ct in detected if not (ct in seen or seen.add(ct))]
    return tuple(uniq)


def validate_magic_bytes(
    *,
    declared_content_type: str,
    header: bytes,
    allowed_content_types: set[str] | None = None,
) -> FileSignatureResult:
    """Valida se o header é compatível com o content_type declarado.

    Regras:
    - Se allowed_content_types for fornecido, o declared_content_type deve estar nele.
    - O header deve indicar pelo menos um tipo; e deve conter o tipo declarado.

    Levanta ValueError quando inválido.
    """
    declared = (declared_content_type or "").strip().lower()
    if not declared:
        raise ValueError("content_type ausente")

    if allowed_content_types is not None and declared not in allowed_content_types:
        raise ValueError("content_type não permitido")

    detected = detect_content_types_from_header(header)
    if not detected:
        raise ValueError("assinatura do arquivo desconhecida")

    # Alguns tipos podem ser compatíveis (ex.: heif/heic) — aceitamos se o declarado
    # estiver entre os detectados.
    if declared not in detected:
        raise ValueError("assinatura do arquivo não corresponde ao content_type")

    return FileSignatureResult(
        declared_content_type=declared,
        detected_content_types=detected,
    )
