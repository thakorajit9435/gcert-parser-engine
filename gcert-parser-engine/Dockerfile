# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies for OCR and PDF handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-guj \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Create a non-root user and group
RUN groupadd -g 10001 appgroup \
    && useradd -u 10001 -g appgroup -d /app -s /sbin/nologin appuser \
    && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Copy project files
COPY --chown=appuser:appgroup . /app/

# Expose port for FastAPI
EXPOSE 8000

# Health check using FastAPI root status endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Default command (can be overridden for Celery workers)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
