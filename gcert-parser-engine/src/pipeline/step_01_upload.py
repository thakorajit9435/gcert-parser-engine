import os
import urllib.parse
import firebase_admin
from firebase_admin import credentials, storage
from src.core.logger import logger
from src.core.exceptions import FileValidationError
from config.settings import settings

class Step01Upload:
    def run(self, context: dict) -> None:
        file_path = context["file_path"]
        job_id = context["job_id"]
        logger.info(f"[{job_id}] Pipeline Step 1: Validating file ingestion and uploading to Storage...")
        
        if not os.path.exists(file_path):
            raise FileValidationError(f"Target PDF file does not exist at: {file_path}")
            
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        logger.info(f"[{job_id}] PDF file validated locally. Size: {file_size_mb:.2f} MB")
        
        context["file_size_mb"] = file_size_mb

        # Upload file to Firebase Storage (or use fallback URL if offline / slow)
        bucket_name = "quizapp-1627022258976.appspot.com"
        blob_name = f"textbooks/{job_id}.pdf"
        encoded_name = urllib.parse.quote_plus(blob_name)
        fallback_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{encoded_name}?alt=media"

        if os.environ.get("SKIP_STORAGE_UPLOAD") == "1":
            logger.info(f"[{job_id}] SKIP_STORAGE_UPLOAD set. Using Storage URL: {fallback_url}")
            context["storage_pdf_url"] = fallback_url
            return

        def perform_upload():
            try:
                try:
                    firebase_admin.get_app()
                except ValueError:
                    cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
                    if not os.path.exists(cred_path):
                        cred_path = str(settings.BASE_DIR.parent / "serviceAccountKey.json")
                    if os.path.exists(cred_path):
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
                    else:
                        return
                bucket = storage.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                blob.upload_from_filename(file_path, content_type="application/pdf", timeout=10)
                logger.info(f"[{job_id}] Successfully uploaded PDF to Storage: {fallback_url}")
            except Exception as e:
                logger.warning(f"[{job_id}] Background Storage PDF upload failed: {str(e)}")

        import threading
        upload_thread = threading.Thread(target=perform_upload, daemon=True)
        upload_thread.start()

        context["storage_pdf_url"] = fallback_url
        logger.info(f"[{job_id}] Assigned Storage URL: {fallback_url}")

