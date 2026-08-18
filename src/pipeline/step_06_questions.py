from src.core.logger import logger
from src.core.exceptions import LLMProcessingError
from src.utils.llm_client import LLMClient

class Step06Questions:
    def run(self, context: dict) -> None:
        logger.info(f"[%s] Pipeline Step 6: Running Question Bank & MCQ Extraction...", context["job_id"])
        
        raw_text = context["extracted_raw_text"]
        
        try:
            llm = LLMClient()
            questions = llm.extract_questions(raw_text)
            
            logger.info(f"[%s] Successfully extracted {len(questions.get('questions', []))} questions and {len(questions.get('mcqs', []))} MCQs.", context["job_id"])
            context["extracted_questions"] = questions
            
        except Exception as e:
            raise LLMProcessingError(f"Question extraction failed: {str(e)}")
        
        
