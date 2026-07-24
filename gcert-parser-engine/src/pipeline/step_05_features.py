from src.core.logger import logger
from src.core.exceptions import LLMProcessingError
from src.utils.llm_client import LLMClient

class Step05Features:
    def run(self, context: dict) -> None:
        logger.info(f"[%s] Pipeline Step 5: Extracting Learning Outcomes, Activities, Keywords, and Notes...", context["job_id"])
        
        raw_text = context["extracted_raw_text"]
        
        try:
            llm = LLMClient()
            features = llm.extract_features(raw_text)
            
            logger.info(f"[%s] Successfully extracted semantic features.", context["job_id"])
            context["extracted_features"] = features
            
        except Exception as e:
            raise LLMProcessingError(f"Features extraction failed: {str(e)}")
