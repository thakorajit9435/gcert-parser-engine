import firebase_admin
from firebase_admin import credentials, storage
import urllib.parse
from config.settings import settings
import os

print(f"GOOGLE_APPLICATION_CREDENTIALS: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
print(f"Absolute path: {os.path.abspath(settings.GOOGLE_APPLICATION_CREDENTIALS)}")
print(f"Exists: {os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS)}")

bucket_name = "quizapp-1627022258976.appspot.com"
try:
    cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
    firebase_admin.initialize_app(cred, {
        "storageBucket": bucket_name
    })
    print("Firebase Admin initialized successfully.")
except Exception as e:
    print(f"Firebase Admin initialization failed: {str(e)}")

try:
    bucket = storage.bucket(bucket_name)
    blob = bucket.blob("textbooks/test_env_dummy.txt")
    blob.upload_from_string("Test upload using settings credentials.", content_type="text/plain")
    print("SUCCESS! File uploaded successfully.")
    encoded = urllib.parse.quote_plus("textbooks/test_env_dummy.txt")
    url = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{encoded}?alt=media"
    print(f"URL: {url}")
except Exception as e:
    print(f"FAILED! Error: {str(e)}")
