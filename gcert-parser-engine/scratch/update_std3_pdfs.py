import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- SEEDING TEXTBOOKS AND UPDATE CHAPTER PDFS ---")

pdf_url_guj = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/chapters%2FNJrgc4KOBQR9h9WGlCy2%2FGujarat-Board-Class-3-Gujarati-First-Langauge-Textbook.pdf?alt=media"

# 1. Update Chapters for Standard 3
chaps = db.collection("chapters").where("standardId", "==", "3").get()
print(f"Retrieved {len(chaps)} chapters for Standard 3 to update.")

updated_count = 0
for ch in chaps:
    data = ch.to_dict()
    ref = db.collection("chapters").document(ch.id)
    
    # Set the real PDF url
    ref.update({
        "pdfUrl": pdf_url_guj,
        "swadhyayPdfUrl": pdf_url_guj
    })
    updated_count += 1

print(f"Updated {updated_count} chapters with PDF URLs.")

# 2. Create textbooks entries for Standard 3
textbooks_data = [
    {
        "id": "tb_guj_std3",
        "title_gu": "ધોરણ ૩ ગુજરાતી પાઠ્યપુસ્તક (કલશોર)",
        "title_en": "Standard 3 Gujarati Kalshor Textbook",
        "subject_id": "guj_std3",
        "standard_id": "3",
        "standard_number": 3,
        "pdf_url": pdf_url_guj,
        "is_active": True,
        "isDeleted": False,
        "publisher": "GSSTB",
        "edition_year": "2024",
        "is_downloadable": True,
        "total_chapters": 10
    },
    {
        "id": "tb_math_std3",
        "title_gu": "ધોરણ ૩ ગણિત ગમ્મત પાઠ્યપુસ્તક",
        "title_en": "Standard 3 Math Ganit Gamat Textbook",
        "subject_id": "math_std3",
        "standard_id": "3",
        "standard_number": 3,
        "pdf_url": pdf_url_guj, # Use same PDF as placeholder
        "is_active": True,
        "isDeleted": False,
        "publisher": "GSSTB",
        "edition_year": "2024",
        "is_downloadable": True,
        "total_chapters": 14
    },
    {
        "id": "tb_evs_std3",
        "title_gu": "ધોરણ ૩ આસપાસ પર્યાવરણ પાઠ્યપુસ્તક",
        "title_en": "Standard 3 EVS Paryavaran Textbook",
        "subject_id": "evs_std3",
        "standard_id": "3",
        "standard_number": 3,
        "pdf_url": pdf_url_guj, # Use same PDF as placeholder
        "is_active": True,
        "isDeleted": False,
        "publisher": "GSSTB",
        "edition_year": "2024",
        "is_downloadable": True,
        "total_chapters": 20
    }
]

for tb in textbooks_data:
    doc_id = tb["id"]
    db.collection("textbooks").document(doc_id).set(tb, merge=True)
    print(f"Textbook {tb['title_gu']} synced.")

print("\n--- SEEDING COMPLETE ---")
