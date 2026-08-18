import os
import json
import sys
from dotenv import load_dotenv
load_dotenv()

# Add src to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.pipeline.step_03_ocr import Step03OCR
from src.pipeline.step_04_hierarchy import Step04Hierarchy

context = {
    "job_id": "test_job_62b6",
    "file_path": "uploads/62b6e802-96b6-41ff-ae71-5d3f2b7ccfb2.pdf",
    "subject_id": "HWC3a4kdFqCvfGB0bPUl",
    "standard_id": "1",
    "standard_number": 1,
    "session": "1",
    "extracted_raw_text": "",
    "layout_blocks": [],
    "extracted_hierarchy": {},
}

print("Running Step 3 OCR...")
ocr = Step03OCR()
ocr.run(context)

print("OCR Text Length:", len(context["extracted_raw_text"]))
print("OCR First 500 chars:")
print(context["extracted_raw_text"][:500])

print("Running Step 4 Hierarchy...")
hierarchy = Step04Hierarchy()
hierarchy.run(context)

print("Extracted Hierarchy:")
print(json.dumps(context["extracted_hierarchy"], ensure_ascii=False, indent=2))
