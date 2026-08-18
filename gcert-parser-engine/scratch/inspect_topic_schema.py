import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
top_docs = db.collection("topics").where("subject_id", "==", "esUIQtd7IAwhiuJAenwI").limit(3).get()

print("--- TOPICS SCHEMA ---")
for t in top_docs:
    print(f"ID: {t.id} | Data: {list(t.to_dict().keys())}")
    print(f"  chapter_id: {t.to_dict().get('chapter_id')}")
