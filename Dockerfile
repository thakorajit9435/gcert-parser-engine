# ─────────────────────────────────────────────────────────────────────────────
# GyanDeep GCERT Parser Engine – Production Dockerfile
# Supports: linux/amd64 (Railway, Render) and linux/arm64 (Oracle Cloud A1)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.13-slim

# ── Core environment ──────────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    # HuggingFace – point cache to a directory we can mount as a persistent volume
    HF_HOME=/app/hf_cache \
    HF_HUB_CACHE=/app/hf_cache/hub \
    # Prevent tokenizer parallelism warnings in forked processes
    TOKENIZERS_PARALLELISM=false \
    # macOS-specific flag (safe to set; ignored on Linux)
    OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES \
    # Disable pip version check in CI
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build tools
    build-essential \
    # OpenCV / image processing
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # PDF processing
    poppler-utils \
    # OCR – Gujarati language pack
    tesseract-ocr \
    tesseract-ocr-guj \
    # Utilities
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Non-root user ─────────────────────────────────────────────────────────────
RUN groupadd -g 10001 appgroup \
    && useradd -u 10001 -g appgroup -d /app -s /sbin/nologin appuser

# ── Create cache directory (will be overridden by persistent volume mount) ───
RUN mkdir -p /app/hf_cache/hub /app/uploads /app/outputs \
    && chown -R appuser:appgroup /app

# ── Application source ────────────────────────────────────────────────────────
COPY --chown=appuser:appgroup . /app/

USER appuser

# ── Port ──────────────────────────────────────────────────────────────────────
EXPOSE 8000

# ── Health check ──────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8000/ || exit 1

# ── Start ─────────────────────────────────────────────────────────────────────
# 2 workers for production; adjust based on available RAM
CMD ["uvicorn", "src.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--timeout-keep-alive", "65"]
