import json

path = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/outputs/fb40cfe7-5c4b-4095-ae16-088a91aa1c99_firestore_payload.json"
try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    textbooks = data.get("textbooks", [])
    chapters = data.get("chapters", [])
    
    print("--- LAST JOB PAYLOAD INSPECTION ---")
    if textbooks:
        print(f"Textbook subject_id: '{textbooks[0].get('subject_id')}'")
        print(f"Textbook standard_id: '{textbooks[0].get('standard_id')}'")
    if chapters:
        print(f"First Chapter subjectId: '{chapters[0].get('subjectId')}'")
        print(f"First Chapter standardId: '{chapters[0].get('standardId')}'")
        print(f"First Chapter document ID: '{chapters[0].get('id')}'")
except Exception as e:
    print(f"Error inspecting payload: {str(e)}")
