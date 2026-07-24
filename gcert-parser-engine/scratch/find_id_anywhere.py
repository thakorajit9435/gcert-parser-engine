import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("../serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

collections = [col.id for col in db.collections()]
print(f"Total collections to search: {len(collections)}")

found = False
for col_name in collections:
    docs = db.collection(col_name).get()
    for d in docs:
        if d.id == "NJrgc4KOBQR9h9WGlCy2":
            print(f"FOUND DOCUMENT: ID matches 'NJrgc4KOBQR9h9WGlCy2' in collection '{col_name}'!")
            print(f"  Fields: {d.to_dict()}")
            found = True
        
        # also search in values
        data = d.to_dict()
        for k, v in data.items():
            if isinstance(v, str) and "NJrgc4KOB" in v:
                print(f"FOUND IN VALUE: Doc '{d.id}' in collection '{col_name}'")
                print(f"  Field '{k}': '{v}'")
                found = True

if not found:
    print("No references to 'NJrgc4KOBQR9h9WGlCy2' found anywhere in the entire Firestore.")
