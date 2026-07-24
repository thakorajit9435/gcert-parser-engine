import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

print("Initializing Firebase Admin...")
try:
    cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
    firebase_admin.initialize_app(cred)
    print("✔ Firebase Admin initialized successfully.")
except ValueError:
    print("✔ Firebase Admin already initialized.")
except Exception as e:
    print(f"❌ Failed to initialize Firebase: {str(e)}")

print("\nSettings Firestore Database ID:", settings.FIRESTORE_DATABASE_ID)

try:
    print("Attempting to get Firestore client...")
    db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    print("✔ Firestore client acquired successfully:", db)
    
    # Try a simple read
    print("Reading collections...")
    collections = db.collections()
    print("Collections found:", [c.id for c in collections])
except Exception as e:
    import traceback
    print("❌ Failed to get Firestore client/collections:")
    traceback.print_exc()
