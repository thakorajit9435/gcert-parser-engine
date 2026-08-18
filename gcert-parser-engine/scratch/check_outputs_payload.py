import os
import json

outputs_dir = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/outputs"
files = [f for f in os.listdir(outputs_dir) if f.endswith("_firestore_payload.json")]

print(f"Found {len(files)} generated payloads in outputs/.\n")

for f in files:
    path = os.path.join(outputs_dir, f)
    try:
        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)
        
        # Print info
        textbooks = data.get("textbooks", [])
        chapters = data.get("chapters", [])
        
        print(f"File: {f}")
        print(f"  Textbooks Count: {len(textbooks)}")
        if textbooks:
            print(f"    First Textbook pdf_url: '{textbooks[0].get('pdf_url')}'")
        print(f"  Chapters Count: {len(chapters)}")
        if chapters:
            print(f"    First Chapter pdfUrl: '{chapters[0].get('pdfUrl')}'")
        print("-" * 50)
    except Exception as e:
        print(f"File: {f} | Error: {str(e)}")
