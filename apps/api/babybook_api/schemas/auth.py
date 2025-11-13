from __future__ import annotations

from pydantic import BaseModel, EmailStr


class CsrfResponse(BaseModel):
    csrf_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    csrf_token: str
