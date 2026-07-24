import os
import fitz # PyMuPDF

uploads_dir = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/uploads"
files = [f for f in os.listdir(uploads_dir) if f.endswith(".pdf")]

print("--- LOCAL PDF FILES IN UPLOADS ---")
for f in files:
    path = os.path.join(uploads_dir, f)
    try:
        doc = fitz.open(path)
        # Get first page text sample
        page_text = ""
        if len(doc) > 0:
            page_text = doc[0].get_text()[:200].replace("\n", " ")
        print(f"File: {f} | Pages: {len(doc)} | Text sample: {page_text[:100]}...")
    except Exception as e:
        print(f"File: {f} | Error: {str(e)}")
