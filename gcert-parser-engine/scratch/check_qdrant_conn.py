import sys
import os

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.qdrant_client import QdrantClientHelper
from config.settings import settings

def test_connection():
    print("--- QDRANT CONNECTION DIAGNOSTIC CHECK ---")
    print(f"Target Configuration:")
    if settings.QDRANT_URL:
        print(f"  URL: {settings.QDRANT_URL}")
        print(f"  API Key Configured: {'Yes' if settings.QDRANT_API_KEY else 'No'}")
    else:
        print(f"  Host: {settings.QDRANT_HOST}")
        print(f"  Port: {settings.QDRANT_PORT}")
        
    print("\nAttempting connection to Qdrant...")
    try:
        helper = QdrantClientHelper()
        client = helper.get_client()
        
        # Test connection by querying collections list
        collections_result = client.get_collections()
        collections = collections_result.collections
        
        print("\n✔ SUCCESS: Successfully connected to Qdrant!")
        print(f"Number of collections found: {len(collections)}")
        for idx, col in enumerate(collections):
            print(f"  [{idx + 1}] Collection Name: {col.name}")
            
    except Exception as e:
        print("\n❌ CONNECTION FAILED!")
        print(f"Error Details: {str(e)}")
        print("\nTroubleshooting Tips:")
        print("1. If running locally, check if Qdrant Docker is running (docker ps).")
        print("2. If running on Cloud, double-check your QDRANT_URL and QDRANT_API_KEY inside your .env file.")
        print("3. Ensure your local network allows traffic on port 6333/6334.")

if __name__ == "__main__":
    test_connection()
