import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

def inspect_doc():
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    
    print("--- INSPECTING SINGLE KB DOCUMENT ---")
    docs = db.collection("ai_knowledge_base").limit(1).get()
    
    if not docs:
        print("No documents found in ai_knowledge_base.")
        return
        
    doc = docs[0]
    data = doc.to_dict()
    print(f"Document ID: {doc.id}")
    print("\nKeys in document:")
    for k, v in data.items():
        val_type = type(v).__name__
        if isinstance(v, list):
            print(f"  {k} ({val_type}): length = {len(v)}, sample = {v[:2]}")
        elif isinstance(v, dict):
            print(f"  {k} ({val_type}): keys = {list(v.keys())}")
        elif isinstance(v, str):
            print(f"  {k} ({val_type}): length = {len(v)}, prefix = {v[:50]}")
        else:
            print(f"  {k} ({val_type}): {v}")

if __name__ == "__main__":
    inspect_doc()
