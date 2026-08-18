import sys
import os
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import firebase_admin
from firebase_admin import credentials, firestore
from config.settings import settings

cred = credentials.Certificate(str(settings.GOOGLE_APPLICATION_CREDENTIALS))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)

print("=== ALL DOCUMENTS IN 'subjects' FOR STD 7 ===")
docs = list(db.collection("subjects").stream())
for d in docs:
    data = d.to_dict()
    std_num = data.get('standard_number') or data.get('standardNumber') or data.get('standard') or data.get('standardId') or data.get('standard_id')
    if "7" in str(std_num):
        print(f"\nDocument ID: {d.id}")
        for k, v in data.items():
            print(f"  {k}: {v}")
