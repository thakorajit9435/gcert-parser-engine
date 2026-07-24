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

        # Upload file to Firebase Storage
        storage_pdf_url = ""
        bucket_name = "quizapp-1627022258976.appspot.com"
        try:
            try:
                firebase_admin.get_app()
            except ValueError:
                cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
                firebase_admin.initialize_app(cred, {
                    "storageBucket": bucket_name
                })
                
            bucket = storage.bucket(bucket_name)
            blob_name = f"textbooks/{job_id}.pdf"
            blob = bucket.blob(blob_name)
            blob.upload_from_filename(file_path, content_type="application/pdf", timeout=600)
            
            encoded_name = urllib.parse.quote_plus(blob_name)
            storage_pdf_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{encoded_name}?alt=media"
            logger.info(f"[{job_id}] Successfully uploaded PDF to Storage: {storage_pdf_url}")
        except Exception as e:
            logger.error(f"[{job_id}] Firebase Storage PDF upload failed: {str(e)}")
            encoded_name = urllib.parse.quote_plus(f"textbooks/{job_id}.pdf")
            storage_pdf_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{encoded_name}?alt=media"
            logger.info(f"[{job_id}] Fallback Storage URL created: {storage_pdf_url}")
            
        context["storage_pdf_url"] = storage_pdf_url

