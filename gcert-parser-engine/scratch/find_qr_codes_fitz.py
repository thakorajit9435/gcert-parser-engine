import fitz
import cv2
import numpy as np
import os

pdf_path = "/Users/ajitthakor/Desktop/Gyan/Students/gcert-parser-engine/uploads/fb40cfe7-5c4b-4095-ae16-088a91aa1c99.pdf"

if not os.path.exists(pdf_path):
    print(f"Error: {pdf_path} not found.")
    exit(1)

doc = fitz.open(pdf_path)
print(f"Scanning {len(doc)} pages for QR codes using OpenCV QRCodeDetector...")

qr_detector = cv2.QRCodeDetector()

found_qr_pages = []

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    
    # Render page to image
    pix = page.get_pixmap(dpi=150)
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    
    # Convert RGB/RGBA to BGR for OpenCV
    if pix.n == 4:
        img_bgr = cv2.cvtColor(img_data, cv2.COLOR_RGBA2BGR)
    else:
        img_bgr = cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
        
    # Detect QR code
    has_qr, decoded_info, _, _ = qr_detector.detectAndDecodeMulti(img_bgr)
    
    if has_qr:
        # Check if any decoded text is non-empty
        valid_qrs = [info for info in decoded_info if info.strip()]
        if valid_qrs:
            print(f"PDF Page {page_num + 1}: QR code detected! Content: {valid_qrs}")
            found_qr_pages.append(page_num + 1)
        else:
            # Even if decoded text is empty, a QR code structure was found
            print(f"PDF Page {page_num + 1}: QR code structure detected (no text).")
            found_qr_pages.append(page_num + 1)

print("\n--- DETECTED QR PAGES SUMMARY ---")
print(f"Pages: {found_qr_pages}")
