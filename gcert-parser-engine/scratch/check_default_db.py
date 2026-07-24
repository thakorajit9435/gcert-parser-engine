import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

try:
    cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

print("--- CHECKING DEFAULT DATABASE (default) ---")
try:
    db = firestore.client() # default database
    print("Acquired default database client successfully.")
    collections = db.collections()
    print("Collections in default database:", [c.id for c in collections])
except Exception as e:
    print("Error querying default database:", str(e))
