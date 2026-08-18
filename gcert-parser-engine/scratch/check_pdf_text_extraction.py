import fitz

pdf_path = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/uploads/fb40cfe7-5c4b-4095-ae16-088a91aa1c99.pdf"
doc = fitz.open(pdf_path)

print("--- CHECKING PDF TEXT EXTRACTION ---")
for idx in range(min(15, len(doc))):
    page = doc.load_page(idx)
    text = page.get_text()
    print(f"Page {idx+1} character count: {len(text)}")
    if text:
        print(f"First 100 chars of page {idx+1}:")
        print(repr(text[:100]))
    print("-" * 40)
