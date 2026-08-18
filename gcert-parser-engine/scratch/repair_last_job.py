import firebase_admin
from firebase_admin import credentials, firestore, storage
import urllib.parse
import os

cred = credentials.Certificate("../serviceAccountKey.json")
bucket_name = "quizapp-1627022258976.appspot.com"
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "storageBucket": bucket_name
    })

db = firestore.client()
bucket = storage.bucket(bucket_name)

job_id = "fb40cfe7-5c4b-4095-ae16-088a91aa1c99"
pdf_path = f"/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/uploads/{job_id}.pdf"

print("--- REPAIRING AND SEEDING JOB fb40cfe7 ---")

# 1. Upload PDF to Storage
storage_pdf_url = ""
if os.path.exists(pdf_path):
    print(f"Uploading PDF {pdf_path} to storage...")
    blob_name = f"textbooks/{job_id}.pdf"
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(pdf_path, content_type="application/pdf", timeout=600)
    encoded_name = urllib.parse.quote_plus(blob_name)
    storage_pdf_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{encoded_name}?alt=media"
    print(f"PDF uploaded successfully: {storage_pdf_url}")
else:
    print(f"PDF not found at {pdf_path}. Cannot upload.")
    exit(1)

# Target IDs in student app
target_subject_id = "esUIQtd7IAwhiuJAenwI" # Standard 1 Gujarati First Language
target_standard_id = "1"

# 2. Update Textbook document
print("Updating textbooks collection...")
tb_ref = db.collection("textbooks").document(f"tb_{target_subject_id}")
tb_ref.set({
    "textbook_id": f"tb_{target_subject_id}",
    "title_gu": "ધોરણ ૧ ગુજરાતી પાઠ્યપુસ્તક (પ્રથમ ભાષા)",
    "title_en": "Standard 1 Gujarati First Language Textbook",
    "subject_id": target_subject_id,
    "standard_id": target_standard_id,
    "standard_number": 1,
    "pdf_url": storage_pdf_url,
    "is_active": True,
    "isDeleted": False,
    "publisher": "GSSTB",
    "edition_year": "2024",
    "is_downloadable": True,
    "total_chapters": 14
}, merge=True)
print(f"Synced textbook tb_{target_subject_id}")

# Delete old textbook tb_sci_std_01 if exists
db.collection("textbooks").document("tb_sci_std_01").delete()
print("Deleted tb_sci_std_01 old textbook document.")

# 3. Query and update chapters collection
print("Updating chapters collection...")
ch_docs = db.collection("chapters").where("subjectId", "==", "sci_std_01").get()
print(f"Found {len(ch_docs)} chapters to update.")
for ch in ch_docs:
    ch_data = ch.to_dict()
    ref = db.collection("chapters").document(ch.id)
    
    # We want to change the document ID or keep doc.id but update contents
    # To keep it simple, update contents and change subjectId and standardId
    ref.update({
        "subjectId": target_subject_id,
        "standardId": target_standard_id,
        "pdfUrl": storage_pdf_url,
        "swadhyayPdfUrl": storage_pdf_url
    })
    print(f"  Chapter '{ch.id}' updated.")

# 4. Update topics collection
print("Updating topics collection...")
top_docs = db.collection("topics").where("subject_id", "==", "sci_std_01").get()
print(f"Found {len(top_docs)} topics to update.")
for top in top_docs:
    ref = db.collection("topics").document(top.id)
    ref.update({
        "subject_id": target_subject_id,
        "standard_id": target_standard_id
    })

# 5. Update mcq_bank collection
print("Updating mcq_bank collection...")
mcq_docs = db.collection("mcq_bank").where("subject_id", "==", "sci_std_01").get()
print(f"Found {len(mcq_docs)} MCQs to update.")
for mcq in mcq_docs:
    ref = db.collection("mcq_bank").document(mcq.id)
    ref.update({
        "subject_id": target_subject_id,
        "standard_id": target_standard_id
    })

# 6. Update question_bank collection
print("Updating question_bank collection...")
q_docs = db.collection("question_bank").where("subject_id", "==", "sci_std_01").get()
print(f"Found {len(q_docs)} questions to update.")
for q in q_docs:
    ref = db.collection("question_bank").document(q.id)
    ref.update({
        "subject_id": target_subject_id,
        "standard_id": target_standard_id
    })

# 7. Update chapter_summaries collection
print("Updating chapter_summaries collection...")
sum_docs = db.collection("chapter_summaries").where("subject_id", "==", "sci_std_01").get()
print(f"Found {len(sum_docs)} summaries to update.")
for sm in sum_docs:
    ref = db.collection("chapter_summaries").document(sm.id)
    ref.update({
        "subject_id": target_subject_id,
        "standard_id": target_standard_id
    })

print("\n--- REPAIR AND SEEDING COMPLETE! ---")
