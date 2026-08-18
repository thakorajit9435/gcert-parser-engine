from typing import Dict, Any
from src.core.logger import logger
from src.pipeline.step_01_upload import Step01Upload
from src.pipeline.step_02_layout import Step02Layout
from src.pipeline.step_03_ocr import Step03OCR
from src.pipeline.step_04_hierarchy import Step04Hierarchy
from src.pipeline.step_05_features import Step05Features
from src.pipeline.step_06_questions import Step06Questions
from src.pipeline.step_07_generator import Step07Generator
from src.pipeline.step_08_loader import Step08Loader

class PipelineManager:
    def __init__(self, job_id: str, file_path: str, subject_id: str, standard_id: str, standard_number: int, session: str = "1"):
        self.context = {
            "job_id": job_id,
            "file_path": file_path,
            "subject_id": subject_id,
            "standard_id": standard_id,
            "standard_number": standard_number,
            "session": session,
            "extracted_raw_text": "",
            "layout_blocks": [],
            "extracted_hierarchy": {},
            "extracted_features": {},
            "extracted_questions": {},
            "final_json_payload": {},
        }

    def execute(self) -> Dict[str, Any]:
        logger.info(f"[%s] Starting pipeline execution...", self.context["job_id"])
        
        # Step 1: Upload / Validate Ingestion
        Step01Upload().run(self.context)
        
        # Step 2: Layout & Segmentation (Header/Footer removal, table/image extraction)
        Step02Layout().run(self.context)
        
        # Step 3: OCR / Text Unicode Normalization
        Step03OCR().run(self.context)
        
        # Step 4: Chapter, Topic, Sub-Topic hierarchy parsing
        Step04Hierarchy().run(self.context)
        
        # Step 5: Learning Outcomes, Activities, Keywords & Revision Notes
        Step05Features().run(self.context)
        
        # Step 6: Question bank and MCQ detection
        Step06Questions().run(self.context)
        
        # Step 7: Final JSON generation and verification
        Step07Generator().run(self.context)
        
        # Step 8: Firestore migration & upload
        Step08Loader().run(self.context)
        
        logger.info(f"[%s] Pipeline execution completed successfully.", self.context["job_id"])
        
        return {
            "job_id": self.context["job_id"],
            "status": "success",
            "summary": {
                "chapters_parsed": len(self.context["extracted_hierarchy"].get("chapters", [])),
                "questions_parsed": len(self.context["extracted_questions"].get("questions", [])),
                "mcqs_parsed": len(self.context["extracted_questions"].get("mcqs", []))
            }
        }
