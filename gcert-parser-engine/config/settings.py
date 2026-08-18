import os
# Force default database to align with React Native client
os.environ["FIRESTORE_DATABASE_ID"] = ""
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "GyanDeep GCERT PDF Parser Engine"
    ENV: str = "development"
    DEBUG: bool = True
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    OUTPUT_DIR: Path = BASE_DIR / "outputs"
    
    # Celery & Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Firebase / Google Cloud
    # OPTION A: file path (local dev)
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", 
        str((Path(__file__).resolve().parent.parent / ".." / "serviceAccountKey.json").resolve())
    )
    # OPTION B: Base64-encoded JSON (cloud deployment)
    # Set FIREBASE_SERVICE_ACCOUNT_BASE64 env var in cloud platform dashboard
    FIREBASE_SERVICE_ACCOUNT_BASE64: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64", "")
    
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "quizapp-1627022258976")
    FIREBASE_STORAGE_BUCKET: str = "gyandeep-ai-education.appspot.com"
    FIRESTORE_DATABASE_ID: str = ""  # Connect to default database
    
    # Qdrant Config
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    QDRANT_COLLECTION: str = "gyandeep_topics"

    # AI Config (Ollama & Gemini)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-m3"
    RERANKER_MODEL_NAME: str = "BAAI/bge-reranker-large"
    CORS_ORIGINS: str = "*"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
