from __future__ import annotations

from pydantic import BaseModel, EmailStr


class CsrfResponse(BaseModel):
    csrf_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    csrf_token: str
    remember_me: bool = False  # Se True, sessão dura 30 dias; senão, dura session_ttl_hours


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    csrf_token: str
    name: str | None = None
