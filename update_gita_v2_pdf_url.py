import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import firebase_admin
from firebase_admin import credentials, firestore
from config.settings import settings

cred = credentials.Certificate(str(settings.GOOGLE_APPLICATION_CREDENTIALS))
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)

exact_pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FShrimad%20Bhagavad%20Gita%20Part%20-2%20Gujarati%20Medium.pdf?alt=media"

# Update textbook document
tb_ref = db.collection("textbooks").document("tb_sub_gita_val_v2")
if tb_ref.get().exists:
    tb_ref.update({
        "pdfUrl": exact_pdf_url,
        "pdf_url": exact_pdf_url,
        "file_url": exact_pdf_url,
        "url": exact_pdf_url
    })
    print("✅ Updated textbook tb_sub_gita_val_v2 PDF URL")

# Update all 10 chapter documents
for c_num in range(1, 11):
    ch_id = f"sub_gita_v2_ch{c_num}"
    ch_ref = db.collection("chapters").document(ch_id)
    if ch_ref.get().exists:
        ch_ref.update({
            "pdfUrl": exact_pdf_url,
            "pdf_url": exact_pdf_url,
            "file_url": exact_pdf_url,
            "url": exact_pdf_url,
            "swadhyayPdfUrl": exact_pdf_url,
            "swadhyay_pdf_url": exact_pdf_url
        })
        print(f"✅ Updated chapter {ch_id} PDF URL")

print("\nVerifying updated documents...")
ch1_doc = db.collection("chapters").document("sub_gita_v2_ch1").get().to_dict()
print(f"Chapter 1 pdfUrl: {ch1_doc.get('pdfUrl')}")
print(f"Chapter 1 startPage: {ch1_doc.get('startPage')}")
