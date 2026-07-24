import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("--- SEEDING CHAPTER PAGE RANGES ---")

# 1. Update Standard 1 Chapters (subjectId: esUIQtd7IAwhiuJAenwI)
std1_pages = {
    "sci_std_01_ch1": (1, 8),
    "sci_std_01_ch2": (9, 20),
    "sci_std_01_ch3": (21, 35),
    "sci_std_01_ch4": (36, 52),
    "sci_std_01_ch5": (53, 63),
    "sci_std_01_ch6": (64, 80)
}

for ch_id, pages in std1_pages.items():
    ref = db.collection("chapters").document(ch_id)
    if ref.get().exists:
        ref.update({
            "startPage": pages[0],
            "endPage": pages[1]
        })
        print(f"Updated Std 1 Chapter {ch_id} pages: {pages}")

# 2. Update Standard 3 Chapters (subjectId: guj_std3)
std3_pages = {
    "guj_std3_ch1": (1, 13),
    "guj_std3_ch2": (14, 30),
    "guj_std3_ch3": (31, 43),
    "guj_std3_ch4": (44, 58),
    "guj_std3_ch5": (59, 76),
    "guj_std3_ch6": (77, 95),
    "guj_std3_ch7": (96, 117),
    "guj_std3_ch8": (118, 135),
    "guj_std3_ch9": (136, 150),
    "guj_std3_ch10": (151, 170)
}

for ch_id, pages in std3_pages.items():
    ref = db.collection("chapters").document(ch_id)
    if ref.get().exists:
        ref.update({
            "startPage": pages[0],
            "endPage": pages[1]
        })
        print(f"Updated Std 3 Chapter {ch_id} pages: {pages}")

print("\n--- PAGE SEEDING COMPLETE ---")
