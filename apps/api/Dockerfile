# syntax=docker/dockerfile:1.7

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/pyproject.toml apps/api/README.md ./apps/api/
COPY apps/api ./apps/api

RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir --use-pep517 ./apps/api

EXPOSE 8000

CMD ["uvicorn", "babybook_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
