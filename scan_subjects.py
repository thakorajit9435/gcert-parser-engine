#!/usr/bin/env python3
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

import firebase_admin
from firebase_admin import credentials, firestore
from config.settings import settings

cred = credentials.Certificate(str(settings.GOOGLE_APPLICATION_CREDENTIALS))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)

docs = list(db.collection("subjects").stream())
print(f"Total documents in 'subjects' collection: {len(docs)}\n")

for d in docs:
    data = d.to_dict()
    std = data.get('standard_number') or data.get('standardNumber') or data.get('standard') or data.get('standardId') or data.get('standard_id')
    name = data.get('nameGu') or data.get('titleGu') or data.get('name') or data.get('title')
    sub_id = data.get('subject_id') or data.get('id')
    active = data.get('isActive') if data.get('isActive') is not None else data.get('is_active')
    print(f"DocID: {d.id:<30} | Std: {str(std):<5} | SubjectID: {str(sub_id):<28} | Active: {str(active):<7} | Name: {name}")

