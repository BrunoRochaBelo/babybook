from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import get_current_session
from babybook_api.db.models import Session as SessionModel
from babybook_api.deps import get_db_session
from babybook_api.schemas.auth import CsrfResponse, LoginRequest, RegisterRequest
from babybook_api.errors import AppError
from babybook_api.security import issue_csrf_token
from babybook_api.services.auth import (
    SESSION_COOKIE_NAME,
    apply_session_cookie,
    authenticate_user,
    create_session,
    revoke_session,
    create_user,
    get_or_create_user_by_email,
)
from babybook_api.settings import settings

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
        remember_me=payload.remember_me,
    )
    await db.commit()

    apply_session_cookie(response, session.token, remember_me=payload.remember_me)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response



@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma conta e inicia sessão do usuário",
)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    user = await create_user(db, payload.email, payload.password, payload.name or payload.email.split("@")[0])
    session = await create_session(
        db,
        user,
        payload.csrf_token,
        user_agent=request.headers.get("user-agent"),
        client_ip=request.client.host if request.client else None,
    )
    await db.commit()

    apply_session_cookie(response, session.token)
    response.status_code = status.HTTP_201_CREATED
    return response


@router.get("/{provider}/authorize", summary="OAuth authorize (dev mock)")
async def oauth_authorize(provider: str, state: str | None = None):
        """
        Dev-only: Render a simple consent page that posts back to this endpoint.
        """
        state_val = state or "/"
        html = f"""
        <!doctype html>
        <html>
        <head>
            <meta charset='utf-8' />
            <title>Mock OAuth - {provider.title()}</title>
        </head>
        <body>
            <h1>Mock OAuth Consent</h1>
            <p>App asks to allow access on behalf of the user.</p>
            <form method='post' action='/auth/{provider}/authorize'>
                <input type='hidden' name='state' value='{state_val}' />
                <button type='submit' name='action' value='authorize'>Authorize</button>
                <button type='submit' name='action' value='deny'>Deny</button>
            </form>
        </body>
        </html>
        """
        return HTMLResponse(content=html)


@router.post("/{provider}/authorize", summary="OAuth authorize POST (dev mock)")
async def oauth_authorize_post(provider: str, action: str = Form(...), state: str | None = Form(None)):
        """
        Dev-only: Handle consent submission. Redirect to callback with a mock code.
        """
        if action != "authorize":
                # Denied -> redirect back to frontend root
                return RedirectResponse(url=state or "/")
        return RedirectResponse(url=f"/auth/{provider}/callback?code=mock&state={state or '/'}")


@router.get("/{provider}/callback", summary="OAuth callback (dev mock)")
async def oauth_callback(provider: str, code: str | None = None, state: str | None = None, request: Request = None, response: Response = None, db: AsyncSession = Depends(get_db_session)) -> Response:
    """
    Dev-only: will create a user and a session and redirect to frontend or to returnTo path.
    """
    if code is None:
        raise AppError(status_code=400, code="auth.oauth.code_missing", message="Missing code")
    # Create an email based on provider and code
    email = f"{provider}.user+{code}@dev.local"
    user = await get_or_create_user_by_email(db, email, name=f"{provider.capitalize()} User")
    # create session
    csrf_token = issue_csrf_token()
    session = await create_session(db, user, csrf_token, user_agent=request.headers.get("user-agent"), client_ip=request.client.host if request.client else None)
    await db.commit()
    apply_session_cookie(response, session.token)
    # Where to redirect: If state is present and starts with '/', make it relative to the FRONTEND URL; otherwise use it as absolute.
    redirect_to = state or "/"
    if redirect_to.startswith("/"):
        return RedirectResponse(url=f"{settings.frontend_url}{redirect_to}")
    return RedirectResponse(url=redirect_to)


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
