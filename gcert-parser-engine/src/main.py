import os
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import json
import uuid
from config.settings import settings
from src.core.logger import logger
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDK initialized successfully.")
except ValueError:
    logger.info("Firebase Admin SDK already initialized.")
except Exception as e:
    logger.error("Failed to initialize Firebase Admin SDK: %s", str(e))

from src.worker import run_parser_pipeline_task
from src.pipeline.firestore_import_engine import FirestoreImportEngine

import time
from collections import defaultdict
from threading import Lock
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title=settings.APP_NAME,
    description="Parser Engine converting GCERT Gujarati Medium textbooks to Firestore JSON.",
    version="1.0.0"
)

# CORS configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InMemoryRateLimiter:
    def __init__(self, requests_limit: int = 100, window_seconds: int = 60):
        self.limit = requests_limit
        self.window = window_seconds
        self.history = defaultdict(list)
        self.lock = Lock()

rate_limiter = InMemoryRateLimiter(requests_limit=5000, window_seconds=60)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Always allow CORS preflight (OPTIONS) requests through directly
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    # Skip rate limiting for status polling, health endpoints, root, and docs
    if (
        path in ["/", "/api/v1/search/health", "/docs", "/openapi.json"]
        or path.startswith("/api/v1/parser/status")
        or "/status" in path
    ):
        return await call_next(request)
        
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    with rate_limiter.lock:
        rate_limiter.history[client_ip] = [t for t in rate_limiter.history[client_ip] if now - t < rate_limiter.window]
        if len(rate_limiter.history[client_ip]) >= rate_limiter.limit:
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
            origin = request.headers.get("origin", "*")
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            return response
        rate_limiter.history[client_ip].append(now)
        
    return await call_next(request)

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, str(exc))
    response = JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )
    origin = request.headers.get("origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, str(exc), exc_info=True)
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", str(exc))
    response = JSONResponse(
        status_code=status_code,
        content={"detail": detail}
    )
    origin = request.headers.get("origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Register RAG & Embeddings Pipeline Router
from src.pipeline.router import router as pipeline_router
app.include_router(pipeline_router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.ENV
    }

import datetime

@app.get("/api/v1/parser/jobs")
async def list_jobs():
    """Scans the outputs directory and returns a list of all parser jobs dynamically."""
    jobs_list = []
    seen_job_ids = set()
    try:
        if not os.path.exists(settings.OUTPUT_DIR):
            return []
            
        for filename in os.listdir(settings.OUTPUT_DIR):
            if filename.endswith("_meta.json"):
                job_id = filename.replace("_meta.json", "")
                if job_id in seen_job_ids:
                    continue
                seen_job_ids.add(job_id)
                meta_path = settings.OUTPUT_DIR / filename
                
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        
                    # Determine current status
                    status = "queued"
                    progress = 0
                    
                    report_path = settings.OUTPUT_DIR / f"{job_id}_import_report.json"
                    checkpoint_path = settings.OUTPUT_DIR / f"{job_id}_import_checkpoint.json"
                    
                    if os.path.exists(report_path):
                        try:
                            with open(report_path, "r", encoding="utf-8") as rf:
                                rep = json.load(rf)
                            status = rep.get("status", "success")
                            progress = 100
                        except Exception:
                            status = "success"
                            progress = 100
                    elif os.path.exists(checkpoint_path):
                        try:
                            with open(checkpoint_path, "r", encoding="utf-8") as cf:
                                chk = json.load(cf)
                            status = "processing"
                            progress = min(95, 10 + len(chk.get("committed_ids", [])) * 5)
                        except Exception:
                            status = "processing"
                            progress = 25
                            
                    jobs_list.append({
                        "id": job_id,
                        "filename": meta.get("filename", "document.pdf"),
                        "status": status,
                        "progress": progress,
                        "standard_number": meta.get("standard_number"),
                        "subject_id": meta.get("subject_id"),
                        "session": meta.get("session", "1"),
                        "timestamp": meta.get("timestamp", "").replace("T", " ")[:16]
                    })
                except Exception as ex:
                    logger.error("Failed to read metadata file %s: %s", filename, str(ex))
                    
        # Sort jobs by timestamp descending
        jobs_list.sort(key=lambda x: x["timestamp"], reverse=True)
        return jobs_list
    except Exception as e:
        logger.error("Failed to list jobs: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/parser/upload")
async def upload_textbook(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    standard_id: str = Form(...),
    standard_number: int = Form(...),
    session: str = Form("1")
):
    if not file.filename.endswith('.pdf') and not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only PDF and ZIP files are supported.")
        
    job_id = str(uuid.uuid4())
    ext = ".pdf" if file.filename.endswith('.pdf') else ".zip"
    temp_file_path = settings.UPLOAD_DIR / f"{job_id}{ext}"
    
    # Save the file locally
    try:
        with open(temp_file_path, "wb") as buffer:
            import shutil
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store upload locally.")
        
    logger.info(f"Received parsing job {job_id} for {subject_id} Standard {standard_number} Session {session}")
    
    # Save a metadata file for this job
    meta_path = settings.OUTPUT_DIR / f"{job_id}_meta.json"
    try:
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "job_id": job_id,
                "filename": file.filename,
                "subject_id": subject_id,
                "standard_id": standard_id,
                "standard_number": standard_number,
                "session": session,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }, f, ensure_ascii=False, indent=2)
    except Exception as ex:
        logger.error(f"Failed to save metadata file: {str(ex)}")

    # Trigger Celery background task asynchronously
    run_parser_pipeline_task.delay(job_id, str(temp_file_path), subject_id, standard_id, standard_number, session)
    
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Parsing job successfully queued.",
        "details": {
            "filename": file.filename,
            "subject_id": subject_id,
            "standard_id": standard_id,
            "standard_number": standard_number,
            "session": session
        }
    }

@app.get("/api/v1/parser/status/{job_id}")
async def get_job_status(job_id: str):
    # Try loading the report first if completed
    report_path = settings.OUTPUT_DIR / f"{job_id}_import_report.json"
    if os.path.exists(report_path):
        try:
            with open(report_path, "r", encoding="utf-8") as f:
                report = json.load(f)
            return {
                "job_id": job_id,
                "status": report.get("status", "success"),
                "progress_percentage": 100,
                "current_step": "COMPLETED",
                "statistics": report.get("summary", {})
            }
        except Exception:
            pass
            
    # Try checking checkpoint progress
    checkpoint_path = settings.OUTPUT_DIR / f"{job_id}_import_checkpoint.json"
    progress = 10
    if os.path.exists(checkpoint_path):
        try:
            with open(checkpoint_path, "r", encoding="utf-8") as f:
                chk = json.load(f)
            # Estimate progress based on committed document count (e.g. max 95% until complete)
            progress = min(95, 10 + len(chk.get("committed_ids", [])) * 5)
        except Exception:
            pass
            
    return {
        "job_id": job_id,
        "status": "processing",
        "progress_percentage": progress,
        "current_step": "Importing to Firestore"
    }

@app.get("/api/v1/parser/jobs/{job_id}/preview")
async def get_job_preview(job_id: str):
    preview_path = settings.OUTPUT_DIR / f"{job_id}_firestore_payload.json"
    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="Preview payload not generated yet.")
    try:
        with open(preview_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read preview payload: {str(e)}")

@app.post("/api/v1/parser/jobs/{job_id}/rollback")
async def rollback_job(job_id: str):
    try:
        importer = FirestoreImportEngine(job_id=job_id)
        deleted_count = importer.rollback()
        return {
            "job_id": job_id,
            "status": "rolled_back",
            "message": f"Successfully deleted {deleted_count} documents from Firestore.",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rollback failed: {str(e)}")
