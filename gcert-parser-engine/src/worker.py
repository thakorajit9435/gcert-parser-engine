import os
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from celery import Celery
from config.settings import settings
from src.core.logger import logger

celery_app = Celery(
    "parser_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)

@celery_app.task(bind=True, name="tasks.run_parser_pipeline")
def run_parser_pipeline_task(self, job_id: str, file_path: str, subject_id: str, standard_id: str, standard_number: int, session: str = "1"):
    logger.info(f"Starting Celery parser task: {self.request.id} for job: {job_id}")
    
    # Import pipeline manager within task execution scope to avoid circular imports
    from src.pipeline.manager import PipelineManager
    
    manager = PipelineManager(
        job_id=job_id,
        file_path=file_path,
        subject_id=subject_id,
        standard_id=standard_id,
        standard_number=standard_number,
        session=session
    )
    
    try:
        result = manager.execute()
        logger.info(f"Finished Celery parser task: {self.request.id} with status: {result['status']}")
        return result
    except Exception as e:
        logger.error(f"Failed to execute parser pipeline for task {self.request.id}: {str(e)}")
        raise e

@celery_app.task(name="tasks.embeddings.generate")
def run_embedding_generation_task(payload: dict):
    logger.info("Starting Celery background embedding generation task...")
    try:
        from src.pipeline.service import EmbeddingPipelineService
        service = EmbeddingPipelineService()
        indexed_count = service.process_and_index_kb_payload(payload)
        logger.info(f"Finished Celery embedding generation task. Indexed {indexed_count} vectors.")
        return {"status": "success", "indexed_count": indexed_count}
    except Exception as e:
        logger.error(f"Failed to execute background embedding generation: {str(e)}")
        raise e
