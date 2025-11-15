FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/workers /app/apps/workers

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e apps/workers

ENV PYTHONPATH=/app/apps/workers

CMD ["python", "-m", "app.main"]

