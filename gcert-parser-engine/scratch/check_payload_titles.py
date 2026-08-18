import json

path = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/outputs/fb40cfe7-5c4b-4095-ae16-088a91aa1c99_firestore_payload.json"
try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    textbooks = data.get("textbooks", [])
    chapters = data.get("chapters", [])
    
    print("--- PAYLOAD TITLES INSPECTION ---")
    if textbooks:
        print(f"Textbook Title Gujarati: '{textbooks[0].get('title_gu')}'")
        print(f"Textbook Title English: '{textbooks[0].get('title_en')}'")
    if chapters:
        print("Chapters:")
        for idx, ch in enumerate(chapters[:5]):
            print(f"  Ch {idx+1}: {ch.get('titleGu')} ({ch.get('title')})")
except Exception as e:
    print(f"Error: {str(e)}")
