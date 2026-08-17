import urllib.parse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

path = "textbooks/Std-6 to 8 ભગવદ્ ગીતા ગુજરાતી માધ્યમ.pdf"
encoded = urllib.parse.quote(path, safe='')
exact_pdf_url = f"https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/{encoded}?alt=media"
print(f"Generated PDF URL:\n{exact_pdf_url}")

# 1. Update build_gita_val_v1_payload.py
v1_script = Path("build_gita_val_v1_payload.py")
content_v1 = v1_script.read_text(encoding="utf-8")
import re
content_v1 = re.sub(r'pdf_url = "https://[^"]+"', f'pdf_url = "{exact_pdf_url}"', content_v1)
v1_script.write_text(content_v1, encoding="utf-8")

# 2. Update build_gita_val_v2_payload.py
v2_script = Path("build_gita_val_v2_payload.py")
content_v2 = v2_script.read_text(encoding="utf-8")
content_v2 = re.sub(r'pdf_url = "https://[^"]+"', f'pdf_url = "{exact_pdf_url}"', content_v2)
v2_script.write_text(content_v2, encoding="utf-8")

print("✅ Successfully updated PDF URL in both Gita Part 1 and Part 2 scripts!")
