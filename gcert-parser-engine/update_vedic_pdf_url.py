import urllib.parse
import re
from pathlib import Path

path = "textbooks/Std-7_વૈદિક ગણિત.pdf"
encoded = urllib.parse.quote(path, safe='')
exact_pdf_url = f"https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/{encoded}?alt=media"

print(f"Generated PDF URL:\n{exact_pdf_url}")

vedic_script = Path("build_std7_vedic_maths_payload.py")
content = vedic_script.read_text(encoding="utf-8")
content = re.sub(r'pdf_url = "https://[^"]+"', f'pdf_url = "{exact_pdf_url}"', content)
vedic_script.write_text(content, encoding="utf-8")

print("✅ Successfully updated PDF URL in build_std7_vedic_maths_payload.py!")
