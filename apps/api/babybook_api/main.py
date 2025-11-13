from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import health, usage, shares
from .settings import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Baby Book API",
        version="0.1.0",
        openapi_url="/openapi.json"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(usage.router, prefix="/me", tags=["usage"])
    app.include_router(shares.router, prefix="/shares", tags=["shares"])

    return app


app = create_app()
