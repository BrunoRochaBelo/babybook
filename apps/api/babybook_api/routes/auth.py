from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import get_current_session
from babybook_api.db.models import Session as SessionModel
from babybook_api.deps import get_db_session
from babybook_api.schemas.auth import CsrfResponse, LoginRequest
from babybook_api.security import issue_csrf_token
from babybook_api.services.auth import (
    SESSION_COOKIE_NAME,
    apply_session_cookie,
    authenticate_user,
    create_session,
    revoke_session,
)

router = APIRouter()


@router.get("/csrf", response_model=CsrfResponse, summary="Emite token CSRF pareado com a sessão atual")
async def csrf_token() -> CsrfResponse:
    return CsrfResponse(csrf_token=issue_csrf_token())


@router.post(
    "/login",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Inicia sessão do usuário",
)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    user = await authenticate_user(db, payload.email, payload.password)
    session = await create_session(
        db,
        user,
        payload.csrf_token,
        user_agent=request.headers.get("user-agent"),
        client_ip=request.client.host if request.client else None,
    )
    await db.commit()

    apply_session_cookie(response, session.token)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoga a sessão atual",
)
async def logout(
    response: Response,
    session: SessionModel = Depends(get_current_session),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    await revoke_session(db, session)
    await db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
