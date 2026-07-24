import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
docs = db.collection("subjects").get()

print("--- ALL SUBJECTS IN FIRESTORE ---")
for d in docs:
    data = d.to_dict()
    print(f"ID: {d.id} | Name: {data.get('name')} | Gujarati: {data.get('nameGu')} | Std: {data.get('standardId')}")
