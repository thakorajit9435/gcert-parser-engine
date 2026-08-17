from src.core.logger import logger
from src.core.exceptions import LLMProcessingError
from src.utils.llm_client import LLMClient

class Step04Hierarchy:
    def run(self, context: dict) -> None:
        logger.info(f"[%s] Pipeline Step 4: Extracting Chapter, Topic, and Sub-Topic hierarchy...", context["job_id"])
        
        raw_text = context["extracted_raw_text"]
        
        try:
            # Invoking LLM model wrapper (Ollama qwen2.5:1.5b) for structured layout parsing
            llm = LLMClient()
            response = llm.segment_hierarchy(raw_text)
            
            logger.info(f"[%s] Segmented textbook hierarchy successfully.", context["job_id"])
            context["extracted_hierarchy"] = response
            
        except Exception as e:
            raise LLMProcessingError(f"Hierarchy extraction failed: {str(e)}")
