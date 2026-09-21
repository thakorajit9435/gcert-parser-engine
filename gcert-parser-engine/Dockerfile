# ─────────────────────────────────────────────────────────────────────────────
# GyanDeep GCERT Parser Engine – Universal Production Dockerfile
# Supports: linux/amd64 (Render, Railway) and linux/arm64 (Oracle Cloud A1)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    HF_HOME=/app/hf_cache \
    HF_HUB_CACHE=/app/hf_cache/hub \
    TOKENIZERS_PARALLELISM=false \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-guj \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

RUN useradd -m -u 1000 appuser || true

RUN mkdir -p /app/hf_cache/hub /app/uploads /app/outputs \
    && chown -R 1000:1000 /app \
    && chmod -R 777 /app/hf_cache /app/uploads /app/outputs

COPY --chown=1000:1000 . /app/

USER 1000

EXPOSE 8000 10000 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/ || exit 1

CMD uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 65
