import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
ch_docs = db.collection("chapters").where("subjectId", "==", "esUIQtd7IAwhiuJAenwI").get()

print("--- CHAPTER PAGES IN FIRESTORE ---")
for ch in ch_docs:
    data = ch.to_dict()
    print(f"ID: {ch.id} | Title: {data.get('titleGu')} | Start: {data.get('startPage')} | End: {data.get('endPage')}")
