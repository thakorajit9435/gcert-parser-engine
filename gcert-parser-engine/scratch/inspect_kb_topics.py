import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

def inspect_topics():
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    
    print("--- RETRIEVING ALL KNOWLEDGE BASE TOPICS ---")
    docs = db.collection("ai_knowledge_base").get()
    
    for doc in docs:
        data = doc.to_dict()
        standard = data.get("standard_id", "N/A")
        subject = data.get("subject_id", "N/A")
        chapter = data.get("chapter_id", "N/A")
        title_gu = data.get("title_gu", "N/A")
        notes = data.get("revision_notes", [])
        print(f"Doc: {doc.id} | Std: {standard} | Sub: {subject} | Title: {title_gu}")
        if notes:
            print(f"  Sample Note: {notes[0]}")

if __name__ == "__main__":
    inspect_topics()
