from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

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
    guestbook,
    health,
    me,
    moments,
    people,
    series,
    shares,
    uploads,
    vault,
)
from .settings import settings
from .deps import AsyncSessionLocal
from .services.auth import bootstrap_dev_user


def create_app() -> FastAPI:
    app = FastAPI(
        title="Baby Book API",
        version="0.1.0",
        openapi_url="/openapi.json"
    )

    app.add_middleware(TraceIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(me.router, prefix="/me", tags=["me"])
    app.include_router(children.router, prefix="/children", tags=["children"])
    app.include_router(people.router, prefix="/people", tags=["people"])
    app.include_router(moments.router, prefix="/moments", tags=["moments"])
    app.include_router(guestbook.router, prefix="/guestbook", tags=["guestbook"])
    app.include_router(shares.router, tags=["shares"])
    app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
    app.include_router(assets.router, tags=["assets"])
    app.include_router(series.router, tags=["series"])
    app.include_router(chapters.router, tags=["chapters"])
    app.include_router(vault.router, tags=["vault"])
    app.include_router(billing.router, tags=["billing"])

    # Dev-only: ensure a dev user exists on startup so developers can login with known credentials
    if settings.app_env == "local":
        @app.on_event("startup")
        async def _seed_dev_user():
            try:
                async with AsyncSessionLocal() as session:
                    await bootstrap_dev_user(session, settings.dev_user_email, settings.dev_user_password, "Dev User")
                    await session.commit()
            except Exception as e:
                # Do not break startup if DB is not ready or migrations not applied yet.
                print(f"[babybook] warning: failed to seed dev user: {e}")

    return app


app = create_app()
