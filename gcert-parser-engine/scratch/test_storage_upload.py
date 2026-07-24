import firebase_admin
from firebase_admin import credentials, storage
import os

cred = credentials.Certificate("../serviceAccountKey.json")
try:
    firebase_admin.initialize_app(cred, {
        "storageBucket": "quizapp-1627022258976.appspot.com"
    })
except Exception:
    pass

bucket = storage.bucket("quizapp-1627022258976.appspot.com")
blob = bucket.blob("textbooks/test_dummy.txt")

try:
    print("Attempting to upload a dummy text file to Firebase Storage...")
    blob.upload_from_string("This is a test upload from Antigravity python script.", content_type="text/plain")
    print("SUCCESS! File uploaded successfully.")
    print(f"Public Link: {blob.public_url}")
except Exception as e:
    print(f"FAILED! Error: {str(e)}")
