import sys
import os

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.qdrant_client import QdrantClientHelper
from config.settings import settings

def count_points():
    print("--- QDRANT COLLECTION STATUS CHECK ---")
    try:
        helper = QdrantClientHelper()
        client = helper.get_client()
        
        collection_name = settings.QDRANT_COLLECTION
        info = client.get_collection(collection_name=collection_name)
        
        print(f"\n✔ Success: Connected to collection '{collection_name}'!")
        print(f"Status: {info.status}")
        print(f"Points Count (Estimated): {info.points_count}")
        print(f"Vectors Count (Estimated): {getattr(info, 'vectors_count', 'N/A')}")
        print(f"Segments Count: {info.segments_count}")
        
    except Exception as e:
        print(f"❌ Error checking collection status: {str(e)}")

if __name__ == "__main__":
    count_points()
