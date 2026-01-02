from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .deps import AsyncSessionLocal
from .errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from .observability import TraceIdMiddleware
from .routes import (
    assets,
    auth,
    billing,
    chapters,
    children,
    deliveries,
    guestbook,
    health,
    me,
    media_processing,
    moments,
    notifications,
    partner_portal,
    partners,
    people,
    resumable_uploads,
    series,
    settings as settings_routes,
    shares,
    uploads,
    vault,
    vouchers,
)
from .services.auth import bootstrap_dev_partner, bootstrap_dev_user
from .settings import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Baby Book API",
        version="0.1.0",
        openapi_url="/openapi.json"
    )

    app.add_middleware(TraceIdMiddleware)
    # Performance: compress responses (especialmente JSON) quando vale a pena.
    # Mantemos um mínimo para não comprimir payloads pequenos.
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        if settings.app_env != "local" or settings.session_cookie_secure:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        # Para uma API purista, default-src 'none' seria o ideal.
        # Como servimos Swagger e OAuth Mocks em dev, usamos 'self' para scripts/styles.
        csp = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "frame-ancestors 'none'; "
            "base-uri 'none'; "
            "form-action 'self';"
        )
        response.headers["Content-Security-Policy"] = csp
        return response
    # Protege contra Host header attacks / cache poisoning via Host.
    # Em staging/prod, ALLOWED_HOSTS é obrigatório e não permite wildcard.
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=(
            ["X-Trace-Id", "X-BB-Session"]
            if (settings.app_env == "local" or settings.allow_header_session_auth)
            else ["X-Trace-Id"]
        ),
    )

    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(me.router, prefix="/me", tags=["me"])
    app.include_router(settings_routes.router, prefix="/me/settings", tags=["settings"])
    app.include_router(notifications.router, prefix="/me/notifications", tags=["notifications"])
    app.include_router(children.router, prefix="/children", tags=["children"])
    app.include_router(people.router, prefix="/people", tags=["people"])
    app.include_router(moments.router, prefix="/moments", tags=["moments"])
    app.include_router(guestbook.router, prefix="/guestbook", tags=["guestbook"])
    app.include_router(shares.router, tags=["shares"])
    app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
    if settings.feature_resumable_uploads:
        app.include_router(resumable_uploads.router, prefix="/uploads/resumable", tags=["uploads"])
    app.include_router(media_processing.router, prefix="/media/processing", tags=["media"])
    app.include_router(assets.router, tags=["assets"])
    app.include_router(series.router, tags=["series"])
    app.include_router(chapters.router, tags=["chapters"])
    app.include_router(vault.router, tags=["vault"])
    app.include_router(billing.router, tags=["billing"])
    # B2B2C: Partners, Vouchers, Deliveries
    app.include_router(partners.router, prefix="/partners", tags=["partners"])
    app.include_router(vouchers.router, tags=["vouchers"])
    app.include_router(deliveries.router, tags=["deliveries"])
    # Partner Portal: Self-service para fotógrafos (role PHOTOGRAPHER)
    app.include_router(partner_portal.router, prefix="/partner", tags=["partner-portal"])

    # Dev-only: ensure dev users exist on startup so developers can login with known credentials
    if settings.app_env == "local":
        @app.on_event("startup")
        async def _seed_dev_users():
            try:
                async with AsyncSessionLocal() as session:
                    # Seed regular dev user
                    await bootstrap_dev_user(session, settings.dev_user_email, settings.dev_user_password, "Dev User")
                    
                    # Seed partner/photographer dev user
                    # Credentials: pro@babybook.dev / pro123
                    await bootstrap_dev_partner(session)
                    
                    await session.commit()
                    print("[babybook] dev users seeded: dev user + partner user")
            except Exception as e:
                # Do not break startup if DB is not ready or migrations not applied yet.
                print(f"[babybook] warning: failed to seed dev users: {e}")

    return app


app = create_app()
