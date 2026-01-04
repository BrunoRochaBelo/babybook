from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr


class CsrfResponse(BaseModel):
    csrf_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    csrf_token: str
    remember_me: bool = False  # Se True, sessão dura 30 dias; senão, dura session_ttl_hours


class PortalLoginRequest(BaseModel):
    """Login do portal (Afiliados/Empresa).

    Diferente do B2C:
    - não exige csrf_token no payload (o backend emite um token pareado com a sessão)
    - retorna um payload com role/email/affiliate_id para a SPA
    """

    email: EmailStr
    password: str
    role: Literal["company_admin", "affiliate"]


class PortalLoginResponse(BaseModel):
    role: Literal["company_admin", "affiliate"]
    email: EmailStr
    affiliate_id: str | None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    csrf_token: str
    name: str | None = None
