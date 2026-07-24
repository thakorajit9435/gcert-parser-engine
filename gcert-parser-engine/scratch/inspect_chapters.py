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
    
    print("--- INSPECTING RECENT/PROCESSED CHAPTERS ---")
    
    # Query chapters that have standardId and are not deleted
    docs = db.collection("chapters").where("isDeleted", "==", False).get()
    
    processed_chapters = []
    for doc in docs:
        data = doc.to_dict()
        if data.get('pdfUrl'):
            processed_chapters.append((doc.id, data))
            
    print(f"Total processed chapters found: {len(processed_chapters)}")
    for ch_id, data in processed_chapters[:20]:
        print(f"ID: {ch_id}")
        print(f"  titleGu: {data.get('titleGu')}")
        print(f"  subjectId: {data.get('subjectId')}")
        print(f"  standardId: {data.get('standardId')}")
        print(f"  startPage: {data.get('startPage')}")
        print(f"  endPage: {data.get('endPage')}")
        print(f"  bookStartPage: {data.get('bookStartPage')}")
        print(f"  pdfUrl: {data.get('pdfUrl')[:60]}...")
        print("-" * 40)

if __name__ == "__main__":
    inspect()
