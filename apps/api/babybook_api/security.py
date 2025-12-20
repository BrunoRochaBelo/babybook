from __future__ import annotations

import secrets
from datetime import datetime

from itsdangerous import BadSignature, BadTimeSignature, SignatureExpired, URLSafeTimedSerializer
from passlib.context import CryptContext

from babybook_api.errors import AppError
from babybook_api.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _csrf_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key, salt="csrf-token")


def issue_csrf_token() -> str:
    serializer = _csrf_serializer()
    return serializer.dumps({"purpose": "csrf", "issued_at": datetime.utcnow().isoformat()})


def validate_csrf_token(token: str) -> None:
    serializer = _csrf_serializer()
    try:
        serializer.loads(token, max_age=settings.csrf_token_ttl_seconds)
    except (BadSignature, BadTimeSignature, SignatureExpired) as exc:
        raise AppError(
            status_code=400,
            code="auth.csrf.invalid",
            message="Token CSRF invalido.",
        ) from exc


def new_session_token() -> str:
    return secrets.token_urlsafe(48)

