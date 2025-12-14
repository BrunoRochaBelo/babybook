FROM python:3.11-slim

# Install ffmpeg with all codecs for media processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libvpx-dev \
    libx264-dev \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/workers /app/apps/workers

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e apps/workers

ENV PYTHONPATH=/app/apps/workers

# Security: run as non-root
RUN groupadd -r app && useradd -r -g app -d /app -s /usr/sbin/nologin app \
    && chown -R app:app /app

USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import app.main" || exit 1

CMD ["python", "-m", "app.main"]

