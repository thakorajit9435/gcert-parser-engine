import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings

def sync_databases():
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    print("Connecting to source database 'topics'...")
    db_source = firestore.client(database_id="topics")
    
    print("Connecting to destination database '(default)'...")
    db_dest = firestore.client() # default database

    collections_to_sync = [
        "topics",
        "sub_topics",
        "learning_outcomes",
        "chapter_summaries",
        "question_bank",
        "mcq_bank",
        "ai_knowledge_base",
        "chat_sessions" # sync existing test chat sessions too!
    ]

    for coll_name in collections_to_sync:
        print(f"\nSyncing collection '{coll_name}'...")
        docs = list(db_source.collection(coll_name).stream())
        print(f"Found {len(docs)} documents in source collection '{coll_name}'.")
        
        count = 0
        batch = db_dest.batch()
        for doc in docs:
            doc_data = doc.to_dict()
            dest_ref = db_dest.collection(coll_name).document(doc.id)
            batch.set(dest_ref, doc_data)
            count += 1
            
            # Commit batch every 400 documents (Firestore limit is 500)
            if count % 400 == 0:
                batch.commit()
                batch = db_dest.batch()
                print(f"Committed batch of 400 documents for '{coll_name}'.")
                
        if count % 400 != 0:
            batch.commit()
            print(f"Committed remaining {count % 400} documents for '{coll_name}'.")
            
        print(f"Successfully synced {count} documents to destination collection '{coll_name}'.")

    print("\n🎉 All collections synced successfully from 'topics' to '(default)' database!")

if __name__ == "__main__":
    sync_databases()
