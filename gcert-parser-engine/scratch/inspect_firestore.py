import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

def inspect():
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    
    print(f"--- INSPECTING FIRESTORE (Database ID: {settings.FIRESTORE_DATABASE_ID}) ---")
    
    collections = ["topics", "sub_topics", "learning_outcomes", "chapter_summaries", "question_bank", "mcq_bank", "activities", "keywords", "glossary", "ai_knowledge_base"]
    
    for col in collections:
        try:
            docs = db.collection(col).limit(5).get()
            count = len(db.collection(col).get()) # Get full count
            print(f"Collection '{col}': {count} documents total")
            if count > 0:
                print(f"  Sample IDs: {[d.id for d in docs]}")
        except Exception as e:
            print(f"Error querying collection '{col}': {str(e)}")

if __name__ == "__main__":
    inspect()
