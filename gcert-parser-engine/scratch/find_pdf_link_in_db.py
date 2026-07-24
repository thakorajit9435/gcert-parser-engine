import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

collections = ["chapters", "textbooks", "worksheets"]
found = False
for col_name in collections:
    docs = db.collection(col_name).get()
    for d in docs:
        data = d.to_dict()
        for k, v in data.items():
            if isinstance(v, str) and ("Gujarat-Board" in v or "NJrgc4KOBQR" in v or "26439068" in v):
                print(f"Found in collection '{col_name}', document ID '{d.id}'")
                print(f"  Field '{k}': '{v}'")
                found = True

if not found:
    print("Not referenced anywhere in Firestore collections.")
