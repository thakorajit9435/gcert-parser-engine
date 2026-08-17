#!/usr/bin/env python3
"""
Direct JSON Import Tool for GCERT Engine & Firebase/Qdrant
Allows loading pre-formatted textbook JSON files directly into Cloud Firestore
and Qdrant Vector Database WITHOUT running the full OCR/LLM parser pipeline.
"""

import sys
import os
import json
import uuid
import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

# Auto-re-execute using venv python if running with system python without virtualenv
venv_python = PROJECT_ROOT / "venv" / "bin" / "python"
if venv_python.exists() and sys.executable != str(venv_python) and "VIRTUAL_ENV" not in os.environ:
    os.execv(str(venv_python), [str(venv_python)] + sys.argv)

from config.settings import settings
from src.core.logger import logger
from src.pipeline.firestore_import_engine import FirestoreImportEngine
from src.pipeline.service import EmbeddingPipelineService

def import_json_file(json_file_path: str, job_id: str = None) -> dict:
    """Imports pre-formatted JSON directly into Firebase Firestore and Qdrant Vector DB."""
    if not os.path.exists(json_file_path):
        print(f"❌ Error: Specified JSON file '{json_file_path}' does not exist.")
        sys.exit(1)

    if not job_id:
        job_id = f"custom_import_{uuid.uuid4().hex[:8]}"

    print("=" * 65)
    print("🚀 Direct JSON Ingestion to Firebase & Vector Database")
    print(f" Job ID:    {job_id}")
    print(f" JSON File: {json_file_path}")
    print("=" * 65)

    with open(json_file_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    # 1. Upload JSON collections to Cloud Firestore
    print("\n📦 Step 1: Uploading JSON payload to Firebase Cloud Firestore...")
    importer = FirestoreImportEngine(job_id=job_id)
    report = importer.import_payload(payload)
    
    summary = report.get("summary", {})
    print(f"  ✅ Firestore Import Finished!")
    print(f"     Total Documents:         {summary.get('total_documents', 0)}")
    print(f"     Successfully Imported:   {summary.get('successfully_imported', 0)}")
    print(f"     Errors Encountered:      {summary.get('errors_encountered', 0)}")

    # 2. Index vector embeddings into Qdrant Vector Database
    print("\n🧠 Step 2: Indexing AI Knowledge Base vector embeddings into Qdrant Vector DB...")
    try:
        embed_service = EmbeddingPipelineService()
        indexed_count = embed_service.process_and_index_kb_payload(payload)
        print(f"  ✅ Qdrant Vector Indexing Finished! Indexed {indexed_count} vector points.")
    except Exception as e:
        print(f"  ⚠️ Vector indexing warning (non-blocking for Firestore): {e}")

    print("\n" + "=" * 65)
    print("🎉 DIRECT JSON INGESTION COMPLETED SUCCESSFULLY!")
    print("   Student App Screens (Chapters, PDF, Quiz, Flashcards) are NOW LIVE!")
    print("=" * 65)
    return report

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import_json.py <path_to_json_file>")
        print("Example: python3 import_json.py outputs/my_custom_textbook.json")
        sys.exit(1)

    json_path = sys.argv[1]
    import_json_file(json_path)

if __name__ == "__main__":
    main()
