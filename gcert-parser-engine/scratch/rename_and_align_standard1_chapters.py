import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- ALIGNING STANDARD 1 CHAPTERS TO ACTUAL ANUKRAMANIKA ---")

pdf_url = "https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2Ffb40cfe7-5c4b-4095-ae16-088a91aa1c99.pdf?alt=media"
subject_id = "esUIQtd7IAwhiuJAenwI" # Standard 1 Gujarati First Language
standard_id = "1"

chapters_data = {
    "sci_std_01_ch1": {
        "titleGu": "૧. નાનાઅમથા વાંદરાભાઈ",
        "title": "1. Nana Amtha Vandrabhai",
        "startPage": 10,
        "endPage": 22,
        "bookStartPage": 1,
        "order": 1
    },
    "sci_std_01_ch2": {
        "titleGu": "૨. વાદળ ગરજે",
        "title": "2. Vadal Garje",
        "startPage": 23,
        "endPage": 39,
        "bookStartPage": 14,
        "order": 2
    },
    "sci_std_01_ch3": {
        "titleGu": "૩. બિલ્લીને આવ્યાં ચક્કર !",
        "title": "3. Billine Avya Chakkar",
        "startPage": 40,
        "endPage": 52,
        "bookStartPage": 31,
        "order": 3
    },
    "sci_std_01_ch4": {
        "titleGu": "૪. ચાલો જોવા જઈએ મેળો",
        "title": "4. Chalo Jova Jaiye Melo",
        "startPage": 53,
        "endPage": 67,
        "bookStartPage": 44,
        "order": 4
    },
    "sci_std_01_ch5": {
        "titleGu": "૫. રીંગણાં લઉં બે-ચાર !",
        "title": "5. Ringna Lau Be Char",
        "startPage": 68,
        "endPage": 85,
        "bookStartPage": 59,
        "order": 5
    },
    "sci_std_01_ch6": {
        "titleGu": "૬. ઉંદરનો ડર",
        "title": "6. Undarno Dar",
        "startPage": 86,
        "endPage": 104,
        "bookStartPage": 77,
        "order": 6
    },
    "sci_std_01_ch7": {
        "titleGu": "૭. ફીરકી ફરરર...",
        "title": "7. Firki Farrer",
        "startPage": 105,
        "endPage": 117,
        "bookStartPage": 96,
        "order": 7
    },
    "sci_std_01_ch8": {
        "titleGu": "૮. નાનકડી ઢીંગલી",
        "title": "8. Nanakdi Dhingli",
        "startPage": 127,
        "endPage": 150,
        "bookStartPage": 118,
        "order": 8
    }
}

for doc_id, info in chapters_data.items():
    ref = db.collection("chapters").document(doc_id)
    ref.set({
        "id": doc_id,
        "chapter_id": doc_id,
        "subjectId": subject_id,
        "standardId": standard_id,
        "title": info["title"],
        "titleGu": info["titleGu"],
        "startPage": info["startPage"],
        "endPage": info["endPage"],
        "bookStartPage": info["bookStartPage"],
        "order": info["order"],
        "pdfUrl": pdf_url,
        "swadhyayPdfUrl": pdf_url,
        "hasMcq": True,
        "hasSwadhyay": True,
        "hasMixedQuiz": True,
        "isDeleted": False,
        "isPremium": False,
        "session": "1"
    }, merge=True)
    print(f"Synced chapter: {doc_id} -> {info['titleGu']}")

# Sync Textbook document count
tb_ref = db.collection("textbooks").document(f"tb_{subject_id}")
tb_ref.update({
    "total_chapters": 8
})
print("Updated textbooks collection total_chapters to 8.")

# Add placeholder topics for Ch 7 and Ch 8 to avoid empty screen crashes
for ch_num in [7, 8]:
    ch_id = f"sci_std_01_ch{ch_num}"
    topic_id = f"{ch_id}_tp1"
    db.collection("topics").document(topic_id).set({
        "topic_id": topic_id,
        "chapter_id": ch_id,
        "subject_id": subject_id,
        "standard_id": standard_id,
        "standard_number": 1,
        "topic_number": 1,
        "display_order": 1,
        "title_gu": "વિષય વસ્તુ પરિચય",
        "title_en": "Content Introduction",
        "content_gu": "આ પ્રકરણના મુખ્ય મુદ્દાઓ અને પ્રવૃત્તિઓની સમજૂતી મેળવવા માટે અહીં ક્લિક કરો.",
        "is_active": True,
        "is_premium": False,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP
    }, merge=True)
    print(f"Created sample topic for {ch_id}")

print("\n--- STANDARD 1 CHAPTER ALIGNMENT COMPLETE ---")
