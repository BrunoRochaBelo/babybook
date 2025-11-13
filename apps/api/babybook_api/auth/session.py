from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-BB-Session", auto_error=False)


async def get_current_user(session_token: str | None = Depends(api_key_header)) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="Sessão não autenticada")

    return {"id": "user_123", "plan": "base"}
