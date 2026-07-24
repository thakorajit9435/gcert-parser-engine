import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
fc_docs = db.collection("flashcards").limit(5).get()

print("--- FLASHCARDS IN FIRESTORE ---")
print(f"Found {len(fc_docs)} documents.")
for fc in fc_docs:
    d = fc.to_dict()
    print(f"ID: {fc.id} | Chapter: {d.get('chapter_id')} | Front: {d.get('front_text_gu')} | Back: {d.get('back_text_gu')}")
