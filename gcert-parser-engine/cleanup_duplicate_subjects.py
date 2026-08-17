#!/usr/bin/env python3
"""
Removes duplicate alias subject documents from the Firestore 'subjects' collection
so that the Student App displays each subject exactly once per standard.
"""

import sys
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

# Duplicate subject IDs to delete from the 'subjects' collection
DUPLICATE_SUBJECT_IDS = [
    # Std 3 Duplicates (Primary: sub_mayur_std3_sl, sub_eng_std3_sl, sub_ganit_mela_std3)
    "sub_mayur_std3",
    "sub_guj_std3_sl",
    "sub_gujarati_std3_sl",
    "sub_eng_std3",
    "sub_english_std3",
    "sub_english_std3_sl",
    "sub_ganit_std3",
    "sub_math_std3",
    "sub_maths_std3",

    # Std 4 Duplicates (Primary: sub_eng_std4_sl)
    "sub_eng_std4",
    "sub_english_std4",
    "sub_english_std4_sl",

    # Std 7 Duplicates (Primary: sub_sanskrut_std7_sem1, sub_hindi_sl_std7_sem1, sub_social_science_std7, sub_vedic_maths_std7, sub_gita_val_v1, sub_english_sl_std7)
    "sub_sanskrut_std7",
    "sub_sanskrit_std7",
    "sub_sans_std7",
    "sub_hindi_sl_std7",
    "sub_hindi_std7",
    "sub_ss_std7",
    "sub_vedic_std7",
    "sub_gita_v1",
    "sub_eng_std7"
]

print("=== CLEANING UP DUPLICATE SUBJECT DOCUMENTS IN FIRESTORE ===")
deleted_count = 0

for doc_id in DUPLICATE_SUBJECT_IDS:
    doc_ref = db.collection("subjects").document(doc_id)
    doc_snap = doc_ref.get()
    if doc_snap.exists:
        doc_ref.delete()
        print(f"🗑️ Deleted duplicate subject doc: {doc_id}")
        deleted_count += 1
    else:
        print(f"ℹ️ Subject doc not found (already deleted or clean): {doc_id}")

print(f"\n✅ Total Duplicate Subject Documents Deleted: {deleted_count}")
