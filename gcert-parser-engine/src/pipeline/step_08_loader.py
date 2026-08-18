import datetime
from src.core.logger import logger
from src.core.exceptions import FirestoreLoaderError
from src.pipeline.firestore_import_engine import FirestoreImportEngine

class Step08Loader:
    def run(self, context: dict) -> None:
        logger.info(f"[%s] Pipeline Step 8: Initializing import engine...", context["job_id"])
        
        payload = context["final_json_payload"]
        job_id = context["job_id"]
        
        try:
            importer = FirestoreImportEngine(job_id=job_id)
            report = importer.import_payload(payload)
            
            context["import_report"] = report
            if report.get("status") == "partial_failure":
                summary = report.get("summary", {})
                logger.warning(
                    f"[%s] Import completed with partial failures. "
                    f"Imported: {summary.get('successfully_imported', 0)}/{summary.get('total_documents', 0)}. "
                    f"Errors: {summary.get('errors_encountered', 0)}. Check import report for details.",
                    context["job_id"]
                )
                
            # Run embedding and vector database indexing
            try:
                from src.pipeline.service import EmbeddingPipelineService
                embed_service = EmbeddingPipelineService()
                indexed_count = embed_service.process_and_index_kb_payload(payload)
                logger.info(f"[%s] Successfully generated and indexed {indexed_count} vector points in Qdrant.", job_id)
            except Exception as embed_err:
                logger.error(f"[%s] Vector embedding indexing failed (non-blocking for Firestore load): {str(embed_err)}")
                
            logger.info(f"[%s] Pipeline Step 8 completed successfully.", job_id)
            
        except Exception as e:
            raise FirestoreLoaderError(f"Loader engine processing failed: {str(e)}")

