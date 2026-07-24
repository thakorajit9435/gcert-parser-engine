import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.qdrant_client import QdrantClientHelper
from src.pipeline.service import EmbeddingPipelineService
from config.settings import settings
from src.core.logger import logger

def reindex_all():
    print("--- REINDEXING EXISTING FIRESTORE TOPICS TO QDRANT ---")
    
    # 1. Initialize Firebase Admin if not already initialized
    try:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred)
        print("✔ Firebase Admin initialized successfully.")
    except ValueError:
        print("✔ Firebase Admin already initialized.")
    except Exception as e:
        print(f"❌ Failed to initialize Firebase: {str(e)}")
        return

    db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    
    # 2. Initialize Qdrant Collection
    print("Initializing Qdrant collection settings...")
    qdrant_helper = QdrantClientHelper()
    qdrant_helper.initialize_collection(force_recreate=True)
    
    # 3. Retrieve all documents from Firestore 'ai_knowledge_base' collection
    print("Fetching documents from Firestore collection 'ai_knowledge_base'...")
    try:
        docs = db.collection("ai_knowledge_base").get()
        kb_docs = [doc.to_dict() for doc in docs]
        
        if not kb_docs:
            print("⚠ No documents found in Firestore 'ai_knowledge_base' collection. Is it empty?")
            return
            
        print(f"✔ Retreived {len(kb_docs)} documents from Firestore.")
        
        # 4. Invoke the Embedding service to process and index
        print("Generating embeddings and upserting points to Qdrant Cloud...")
        service = EmbeddingPipelineService()
        indexed_count = service.process_and_index_kb_payload({"ai_knowledge_base": kb_docs})
        
        print("\n✔ REINDEXING COMPLETE!")
        print(f"Successfully processed and indexed {indexed_count} vector points into Qdrant Cloud!")
        
    except Exception as e:
        print(f"❌ Reindexing failed: {str(e)}")

if __name__ == "__main__":
    reindex_all()
