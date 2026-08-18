import sys
import os

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.qdrant_client import QdrantClientHelper
from config.settings import settings

qdrant_helper = QdrantClientHelper()
client = qdrant_helper.get_client()

print("Retrieving points from Qdrant Cloud...")
collection_name = settings.QDRANT_COLLECTION

points, _ = client.scroll(
    collection_name=collection_name,
    limit=5,
    with_payload=True,
    with_vectors=False
)

for p in points:
    print(f"Point ID: {p.id}")
    print("Payload:")
    for k, v in p.payload.items():
        print(f"  {k}: {v}")
    print("-" * 40)
