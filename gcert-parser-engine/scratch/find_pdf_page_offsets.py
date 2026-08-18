import fitz # PyMuPDF
import os

pdf_path = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/uploads/fb40cfe7-5c4b-4095-ae16-088a91aa1c99.pdf"

if not os.path.exists(pdf_path):
    print(f"Error: PDF file {pdf_path} does not exist.")
    exit(1)

doc = fitz.open(pdf_path)
total_pages = len(doc)
print(f"Loaded PDF: {pdf_path}")
print(f"Total PDF pages: {total_pages}\n")

# Keywords we want to search for
chapters_search = [
    ("તારાં નાનાં બાળ", 1),
    ("થઈએ કાકાકૌઆ", 2),
    ("છુકછુક ગાડી", 3),
    ("ખો ખો રમતું કબૂતર", 4),
    ("મામાને ઘેર જાવા દે", 5),
    ("જાણો મારાં કામ", 6),
    ("અમારે તે દેશ", 7)
]

print("Scanning PDF pages for chapter titles...")
found_pages = {}
for page_num in range(total_pages):
    page = doc.load_page(page_num)
    text = page.get_text()
    if not text:
        continue
    
    for title, ch_num in chapters_search:
        if title in text:
            print(f"Found keyword '{title}' on PDF Page {page_num + 1}")
            if ch_num not in found_pages:
                found_pages[ch_num] = []
            found_pages[ch_num].append(page_num + 1)

print("\nScan Summary:")
for ch_num, pages in sorted(found_pages.items()):
    print(f"Chapter {ch_num}: found on PDF pages {pages}")
