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

print("=== ALL SUBJECT DOCUMENTS IN FIRESTORE ===")
subjects_ref = db.collection("subjects")
docs = list(subjects_ref.stream())

print(f"Total documents in 'subjects' collection: {len(docs)}\n")

subjects_by_std = {}
for d in docs:
    data = d.to_dict()
    std_num = data.get('standard_number') or data.get('standardNumber') or data.get('standard') or data.get('standardId') or data.get('standard_id') or "Unknown"
    doc_id = d.id
    name_gu = data.get('nameGu') or data.get('titleGu') or data.get('name') or "No Name"
    subj_id = data.get('subject_id') or data.get('id') or doc_id
    is_active = data.get('isActive') if data.get('isActive') is not None else data.get('is_active')
    
    subjects_by_std.setdefault(str(std_num), []).append({
        'doc_id': doc_id,
        'subject_id': subj_id,
        'name_gu': name_gu,
        'is_active': is_active,
        'data': data
    })

for std, items in sorted(subjects_by_std.items()):
    if std in ["3", "4", "7"]:
        print(f"==========================================")
        print(f"Standard: {std} ({len(items)} entries)")
        print(f"==========================================")
        for item in items:
            print(f"ID: {item['doc_id']:<30} | Name: {item['name_gu']:<45} | Active: {item['is_active']}")
        print()
