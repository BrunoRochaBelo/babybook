from __future__ import annotations

import pytest

from babybook_api.uploads.file_validation import detect_content_types_from_header, validate_magic_bytes


def test_detect_jpeg() -> None:
    header = b"\xFF\xD8\xFF\xE0" + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "image/jpeg" in detected


def test_detect_png() -> None:
    header = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "image/png" in detected


def test_detect_gif() -> None:
    header = b"GIF89a" + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "image/gif" in detected


def test_detect_webp() -> None:
    header = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "image/webp" in detected


def test_detect_mp4_from_ftyp() -> None:
    # size(4) + 'ftyp' + major_brand='isom'
    header = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "video/mp4" in detected


def test_detect_quicktime_from_ftyp() -> None:
    header = b"\x00\x00\x00\x18ftypqt  " + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "video/quicktime" in detected


def test_detect_heic_from_ftyp() -> None:
    header = b"\x00\x00\x00\x18ftypheic" + b"\x00" * 32
    detected = detect_content_types_from_header(header)
    assert "image/heic" in detected


def test_validate_magic_bytes_success() -> None:
    header = b"\xFF\xD8\xFF\xE0" + b"\x00" * 32
    result = validate_magic_bytes(
        declared_content_type="image/jpeg",
        header=header,
        allowed_content_types={"image/jpeg", "image/png"},
    )
    assert result.declared_content_type == "image/jpeg"


def test_validate_magic_bytes_rejects_mismatch() -> None:
    header = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 32
    with pytest.raises(ValueError):
        validate_magic_bytes(declared_content_type="image/jpeg", header=header)


def test_validate_magic_bytes_rejects_unknown() -> None:
    header = b"\x00" * 64
    with pytest.raises(ValueError):
        validate_magic_bytes(declared_content_type="image/jpeg", header=header)
