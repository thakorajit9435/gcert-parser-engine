import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
ch_docs = db.collection("chapters").where("subjectId", "==", "esUIQtd7IAwhiuJAenwI").get()

print("--- VERIFYING CHAPTERS IN DB ---")
for ch in sorted(ch_docs, key=lambda x: x.to_dict().get('order', 99)):
    d = ch.to_dict()
    print(f"ID: {ch.id}")
    print(f"  TitleGu: '{d.get('titleGu')}'")
    print(f"  startPage: {d.get('startPage')}")
    print(f"  endPage: {d.get('endPage')}")
    print(f"  bookStartPage: {d.get('bookStartPage')}")
    print(f"  pdfUrl: '{d.get('pdfUrl')[:60] if d.get('pdfUrl') else None}...'")
    print("-" * 30)
