from __future__ import annotations

from html import escape as html_escape
from urllib.parse import quote

from fastapi import APIRouter, Depends, Form, Request, Response, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import get_current_session, require_csrf_token
from babybook_api.db.models import Session as SessionModel
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.request_ip import get_client_ip
from babybook_api.schemas.auth import CsrfResponse, LoginRequest, RegisterRequest
from babybook_api.security import issue_csrf_token
from babybook_api.services.auth import (
    SESSION_COOKIE_NAME,
    apply_session_cookie,
    authenticate_user,
    create_session,
    create_user,
    get_or_create_user_by_email,
    revoke_all_user_sessions,
    revoke_session,
)
from babybook_api.settings import settings

router = APIRouter()


def _client_ip(request: Request) -> str:
    return get_client_ip(request)


def _require_local_env(feature: str) -> None:
    if settings.app_env != "local":
        raise AppError(
            status_code=404,
            code="auth.not_found",
            message=f"Recurso indisponivel ({feature}).",
        )


def _sanitize_frontend_path(value: str | None, *, fallback: str = "/") -> str:
    """Permite apenas caminhos internos (evita open redirect via state/redirectTo)."""
    if not value:
        return fallback
    # Apenas paths absolutos dentro do site
    if not value.startswith("/"):
        return fallback
    # Bloqueia protocolo-relativo e backslashes
    if value.startswith("//") or "\\" in value:
        return fallback
    # Bloqueia valores patológicos
    if "\x00" in value or len(value) > 2048:
        return fallback
    return value


@router.get("/csrf", response_model=CsrfResponse, summary="Emite token CSRF pareado com a sessão atual")
async def csrf_token(request: Request) -> CsrfResponse:
    await enforce_rate_limit(bucket="auth:csrf:ip", limit="120/minute", identity=_client_ip(request))
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
    await enforce_rate_limit(bucket="auth:login:ip", limit="20/minute", identity=_client_ip(request))
    await enforce_rate_limit(
        bucket="auth:login:email",
        limit="10/minute",
        identity=payload.email.strip().lower(),
    )
    user = await authenticate_user(db, payload.email, payload.password)
    session = await create_session(
        db,
        user,
        payload.csrf_token,
        user_agent=request.headers.get("user-agent"),
        client_ip=get_client_ip(request),
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
    await enforce_rate_limit(bucket="auth:register:ip", limit="10/minute", identity=_client_ip(request))
    await enforce_rate_limit(
        bucket="auth:register:email",
        limit="5/minute",
        identity=payload.email.strip().lower(),
    )
    user = await create_user(db, payload.email, payload.password, payload.name or payload.email.split("@")[0])
    session = await create_session(
        db,
        user,
        payload.csrf_token,
        user_agent=request.headers.get("user-agent"),
        client_ip=get_client_ip(request),
    )
    await db.commit()

    apply_session_cookie(response, session.token)
    response.status_code = status.HTTP_201_CREATED
    return response


@router.get("/{provider}/authorize", summary="OAuth authorize (dev mock)")
async def oauth_authorize(provider: str, state: str | None = None):
        _require_local_env("oauth_mock")
        """Dev-only: Render a simple consent page that posts back to this endpoint."""

        state_val = _sanitize_frontend_path(state, fallback="/")
        # Escape para evitar XSS em dev (state é input do usuário)
        state_escaped = html_escape(state_val, quote=True)
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
                <input type='hidden' name='state' value='{state_escaped}' />
                <button type='submit' name='action' value='authorize'>Authorize</button>
                <button type='submit' name='action' value='deny'>Deny</button>
            </form>
        </body>
        </html>
        """
        return HTMLResponse(content=html)


@router.post("/{provider}/authorize", summary="OAuth authorize POST (dev mock)")
async def oauth_authorize_post(provider: str, action: str = Form(...), state: str | None = Form(None)):
    _require_local_env("oauth_mock")
    """Dev-only: Handle consent submission. Redirect to callback with a mock code."""

    state_val = _sanitize_frontend_path(state, fallback="/")
    if action != "authorize":
        # Denied -> redirect back to frontend
        return RedirectResponse(url=f"{settings.frontend_url}{state_val}", status_code=303)

    # Encode state to keep the callback URL well-formed
    state_q = quote(state_val, safe="")
    return RedirectResponse(url=f"/auth/{provider}/callback?code=mock&state={state_q}", status_code=303)


@router.get("/{provider}/callback", summary="OAuth callback (dev mock)")
async def oauth_callback(
    provider: str,
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    _require_local_env("oauth_mock")
    """Dev-only: will create a user and a session and redirect to frontend."""
    if code is None:
        raise AppError(status_code=400, code="auth.oauth.code_missing", message="Missing code")
    # Email precisa ser válido (EmailStr/Pydantic rejeita TLDs reservados como .local)
    email = f"{provider}.user+{code}@example.com"
    user = await get_or_create_user_by_email(db, email, name=f"{provider.capitalize()} User")
    # create session
    csrf_token = issue_csrf_token()
    user_agent = request.headers.get("user-agent")
    client_ip = get_client_ip(request)
    session = await create_session(db, user, csrf_token, user_agent=user_agent, client_ip=client_ip)
    await db.commit()
    redirect_to = _sanitize_frontend_path(state, fallback="/")
    redirect_response = RedirectResponse(url=f"{settings.frontend_url}{redirect_to}")
    apply_session_cookie(redirect_response, session.token)
    return redirect_response


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoga a sessão atual",
)
async def logout(
    response: Response,
    _: None = Depends(require_csrf_token),
    session: SessionModel = Depends(get_current_session),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    await revoke_session(db, session)
    await db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post(
    "/logout/all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoga TODAS as sessões do usuário",
)
async def logout_all(
    response: Response,
    _: None = Depends(require_csrf_token),
    session: SessionModel = Depends(get_current_session),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    await revoke_all_user_sessions(db, session.user_id)
    await db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
