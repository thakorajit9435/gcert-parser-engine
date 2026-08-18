import firebase_admin
from firebase_admin import credentials, storage

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        "storageBucket": "quizapp-1627022258976.appspot.com"
    })

bucket = storage.bucket()
blobs = bucket.list_blobs()

print("--- ALL PDF FILES IN FIREBASE STORAGE ---")
count = 0
for blob in blobs:
    if blob.name.endswith(".pdf") or ".pdf" in blob.name.lower():
        print(f"Path: gs://quizapp-1627022258976.appspot.com/{blob.name} | Size: {blob.size} bytes")
        count += 1
print(f"\nTotal PDFs: {count}")
