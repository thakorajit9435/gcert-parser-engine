import os
import json
import sys
import datetime
from typing import Dict, Any, List, Set
import firebase_admin
from firebase_admin import credentials, firestore
from src.core.logger import logger
from src.core.exceptions import FirestoreLoaderError
from config.settings import settings

class FirestoreImportEngine:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.checkpoint_file = settings.OUTPUT_DIR / f"{job_id}_import_checkpoint.json"
        self.report_file = settings.OUTPUT_DIR / f"{job_id}_import_report.json"
        
        # Initialize Firebase Admin if not already initialized
        try:
            self.cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
            firebase_admin.initialize_app(self.cred)
        except ValueError:
            pass  # Already initialized
            
        self.db = firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
        self.committed_ids: Set[str] = self._load_checkpoint()

    def _load_checkpoint(self) -> Set[str]:
        """Loads already committed document IDs to support resumption on failure."""
        if os.path.exists(self.checkpoint_file):
            try:
                with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logger.info(f"[%s] Resuming import. Found {len(data.get('committed_ids', []))} already imported documents.", self.job_id)
                    return set(data.get("committed_ids", []))
            except Exception as e:
                logger.warning(f"[%s] Failed to read checkpoint file: {str(e)}. Starting from scratch.", self.job_id)
        return set()

    def _save_checkpoint(self) -> None:
        """Saves current committed document IDs back to local disk."""
        try:
            with open(self.checkpoint_file, "w", encoding="utf-8") as f:
                json.dump({
                    "job_id": self.job_id,
                    "updated_at": datetime.datetime.utcnow().isoformat(),
                    "committed_ids": list(self.committed_ids)
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"[%s] Failed to write checkpoint: {str(e)}", self.job_id)

    def _print_progress_bar(self, current: int, total: int, prefix: str = 'Progress') -> None:
        """Renders a simple command-line progress bar in stdout."""
        if total == 0:
            return
        percent = (current / total) * 100
        bar_length = 40
        filled_length = int(bar_length * current // total)
        bar = '#' * filled_length + '-' * (bar_length - filled_length)
        sys.stdout.write(f'\r{prefix}: [{bar}] {percent:.1f}% ({current}/{total})')
        sys.stdout.flush()
        if current == total:
            sys.stdout.write('\n')

    def check_duplicate(self, collection: str, doc_id: str) -> bool:
        """Queries Firestore to check if the document ID is already registered."""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_snapshot = doc_ref.get()
            return doc_snapshot.exists
        except Exception as e:
            logger.warning(f"[%s] Error querying document duplication for {collection}/{doc_id}: {str(e)}", self.job_id)
            return False

    def import_payload(self, payload: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Main execution flow for validating, batching, deduplicating, and importing payload."""
        logger.info(f"[%s] Starting Firestore Import Engine...", self.job_id)
        
        report = {
            "job_id": self.job_id,
            "status": "started",
            "started_at": datetime.datetime.utcnow().isoformat(),
            "summary": {
                "total_documents": 0,
                "successfully_imported": 0,
                "duplicates_skipped": 0,
                "errors_encountered": 0
            },
            "failures": [],
            "skipped_duplicates": []
        }
        
        # Flatten and group documents
        all_docs = []
        for collection_name, documents in payload.items():
            for doc in documents:
                # Deduce document primary ID
                doc_id = (
                    doc.get("id")
                    or doc.get("quiz_id")
                    or doc.get("flashcard_id")
                    or doc.get(f"{collection_name.rstrip('s')}_id") 
                    or doc.get("session_id")
                    or doc.get("topic_id") 
                    or doc.get("outcome_id") 
                    or doc.get("summary_id") 
                    or doc.get("question_id") 
                    or doc.get("mcq_id") 
                    or doc.get("glossary_id") 
                    or doc.get("word_gu")
                )
                if not doc_id:
                    logger.warning(f"[%s] Document in collection {collection_name} does not possess primary identifier. Skipping.", self.job_id)
                    continue
                all_docs.append((collection_name, doc_id, doc))
        
        total_docs = len(all_docs)
        report["summary"]["total_documents"] = total_docs
        
        logger.info(f"[%s] Total identified documents to process: {total_docs}", self.job_id)
        
        batch = self.db.batch()
        batch_operations: List[tuple] = []  # Tracks document tags in active batch
        batch_doc_data_map: Dict[str, Dict[str, Any]] = {}  # Maps doc_id -> doc_data for sub-batch retry
        processed_count = 0
        
        for collection_name, doc_id, doc_data in all_docs:
            processed_count += 1
            self._print_progress_bar(processed_count, total_docs, prefix="Importing Textbook")
            
            # 1. Skip if already processed in previous runtime checkpoint
            if doc_id in self.committed_ids:
                report["summary"]["successfully_imported"] += 1
                continue
                
            # 2. Upsert/overwrite document in Firestore (batch.set performs atomic upsert)
            doc_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            if "createdAt" not in doc_data:
                doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
                
            doc_ref = self.db.collection(collection_name).document(doc_id)
            batch.set(doc_ref, doc_data)
            batch_operations.append((collection_name, doc_id))
            batch_doc_data_map[doc_id] = doc_data
            
            # If this is a quiz question, ALSO write to subcollections under quizzes/{quiz_id} for student app queries
            quiz_id = doc_data.get("quizId") or doc_data.get("quiz_id")
            if collection_name in ["questions", "mcqs", "question_bank"] and quiz_id:
                for subcol_name in ["questions", "mcqs", "question_bank"]:
                    subcol_ref = self.db.collection("quizzes").document(quiz_id).collection(subcol_name).document(doc_id)
                    batch.set(subcol_ref, doc_data)
            
            # Commit batch at Firestore threshold of 500
            if len(batch_operations) >= 450:
                self._commit_batch(batch, batch_operations, report, batch_doc_data_map)
                batch = self.db.batch()
                batch_operations = []
                batch_doc_data_map = {}
                
        # Commit final remaining batch operations
        if len(batch_operations) > 0:
            self._commit_batch(batch, batch_operations, report, batch_doc_data_map)
            
        # Finish and save report
        report["finished_at"] = datetime.datetime.utcnow().isoformat()
        if report["summary"]["errors_encountered"] == 0:
            report["status"] = "success"
            # Clear checkpoint file on clean completion
            if os.path.exists(self.checkpoint_file):
                os.remove(self.checkpoint_file)
        else:
            report["status"] = "partial_failure"
            
        with open(self.report_file, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
            
        logger.info(f"[%s] Import finished. Status: {report['status']}. Report saved to {self.report_file}", self.job_id)
        return report

    def _commit_batch(self, batch: firestore.WriteBatch, operations: List[tuple], report: Dict[str, Any], doc_data_map: Dict[str, Dict[str, Any]] = None) -> None:
        """Commits batch transactions and logs failure/resumption states.
        
        If a commit fails due to Firestore's payload size limit (11MB), the batch
        is automatically split into smaller sub-batches and retried recursively.
        
        Args:
            batch: The Firestore WriteBatch to commit.
            operations: List of (collection_name, doc_id) tuples in this batch.
            report: The import report dictionary to update.
            doc_data_map: Optional mapping of doc_id -> doc_data for rebuilding
                         sub-batches on retry. If None, failed batches cannot be split.
        """
        try:
            batch.commit()
            # On success, add all batch doc IDs to checkpoint state
            for _, doc_id in operations:
                self.committed_ids.add(doc_id)
            report["summary"]["successfully_imported"] += len(operations)
            self._save_checkpoint()
        except Exception as e:
            error_msg = str(e)
            is_payload_too_large = "payload size exceeds the limit" in error_msg.lower()
            
            # If payload is too large and we can split, retry with smaller sub-batches
            if is_payload_too_large and doc_data_map and len(operations) > 1:
                mid = len(operations) // 2
                left_ops = operations[:mid]
                right_ops = operations[mid:]
                
                logger.warning(
                    f"[%s] Batch payload too large ({len(operations)} docs). "
                    f"Splitting into sub-batches of {len(left_ops)} and {len(right_ops)} docs.",
                    self.job_id
                )
                
                for sub_ops in [left_ops, right_ops]:
                    sub_batch = self.db.batch()
                    for col, doc_id in sub_ops:
                        doc_ref = self.db.collection(col).document(doc_id)
                        sub_batch.set(doc_ref, doc_data_map[doc_id])
                        
                        # Replicate subcollection write for quiz questions
                        doc_data = doc_data_map[doc_id]
                        quiz_id = doc_data.get("quizId") or doc_data.get("quiz_id")
                        if col == "questions" and quiz_id:
                            subcol_ref = self.db.collection("quizzes").document(quiz_id).collection("questions").document(doc_id)
                            sub_batch.set(subcol_ref, doc_data)
                    
                    # Recursively commit the sub-batch (will split further if still too large)
                    self._commit_batch(sub_batch, sub_ops, report, doc_data_map)
            else:
                # Cannot split further or different error — record as permanent failure
                logger.error(f"[%s] Firestore batch write transaction failed. Rollback triggered: {str(e)}", self.job_id)
                report["summary"]["errors_encountered"] += len(operations)
                report["failures"].append({
                    "error": error_msg,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "documents": [{"collection": col, "doc_id": did} for col, did in operations]
                })
                # Save checkpoint without failed IDs so they can be retried later.
                self._save_checkpoint()

    def rollback(self) -> int:
        """Deletes all successfully committed document IDs associated with this job run."""
        deleted_count = 0
        
        # 1. Gather document IDs to delete by collection
        doc_ids_by_collection: Dict[str, Set[str]] = {}
        collections = [
            "subjects", "chapters", "textbooks", "topics", "sub_topics", 
            "learning_outcomes", "chapter_summaries", "question_bank", 
            "mcq_bank", "mcqs", "quizzes", "questions", "flashcards",
            "activities", "keywords", "glossary", 
            "ai_knowledge_base", "sessions"
        ]
        for col in collections:
            doc_ids_by_collection[col] = set()
            
        # If we have committed IDs in the active memory/checkpoint, populate them
        if self.committed_ids:
            for col in collections:
                for doc_id in self.committed_ids:
                    doc_ids_by_collection[col].add(doc_id)
                    
        # Load from payload backup file to fetch all created IDs
        payload_file = settings.OUTPUT_DIR / f"{self.job_id}_firestore_payload.json"
        if os.path.exists(payload_file):
            try:
                with open(payload_file, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                
                for collection_name, documents in payload.items():
                    if collection_name in doc_ids_by_collection:
                        for doc in documents:
                            doc_id = (
                                doc.get(f"{collection_name.rstrip('s')}_id") 
                                or doc.get("session_id")
                                or doc.get("topic_id") 
                                or doc.get("outcome_id") 
                                or doc.get("summary_id") 
                                or doc.get("question_id") 
                                or doc.get("mcq_id") 
                                or doc.get("glossary_id") 
                                or doc.get("word_gu")
                                or doc.get("id")
                            )
                            if doc_id:
                                doc_ids_by_collection[collection_name].add(doc_id)
            except Exception as e:
                logger.error(f"[%s] Failed to read payload file for rollback: {str(e)}", self.job_id)
                
        # 2. Perform batched deletion from Firestore
        batch = self.db.batch()
        batch_operations_count = 0
        
        for collection_name, doc_ids in doc_ids_by_collection.items():
            for doc_id in doc_ids:
                doc_ref = self.db.collection(collection_name).document(doc_id)
                batch.delete(doc_ref)
                deleted_count += 1
                batch_operations_count += 1
                
                if batch_operations_count == 500:
                    batch.commit()
                    batch = self.db.batch()
                    batch_operations_count = 0
                    
        if batch_operations_count > 0:
            batch.commit()
            
        # 3. Delete Qdrant vector embeddings associated with these chapters
        try:
            from src.utils.qdrant_client import QdrantClientHelper
            from qdrant_client.http import models
            
            qdrant_helper = QdrantClientHelper()
            client = qdrant_helper.get_client()
            
            ch_ids = list(doc_ids_by_collection.get("chapters", []))
            if ch_ids:
                logger.info(f"[%s] Deleting vector embeddings from Qdrant for chapters: {ch_ids}", self.job_id)
                client.delete(
                    collection_name=settings.QDRANT_COLLECTION,
                    points_selector=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="chapter",
                                match=models.MatchAny(any=ch_ids)
                            )
                        ]
                    )
                )
        except Exception as e:
            logger.warning(f"[%s] Non-blocking: failed to delete vector points from Qdrant during rollback: {str(e)}", self.job_id)
            
        # Clean up files
        if os.path.exists(self.checkpoint_file):
            os.remove(self.checkpoint_file)
        if os.path.exists(self.report_file):
            os.remove(self.report_file)
        
        # We can also update the report file status to "rolled_back"
        try:
            with open(self.report_file, "w", encoding="utf-8") as f:
                json.dump({
                    "job_id": self.job_id,
                    "status": "rolled_back",
                    "rolled_back_at": datetime.datetime.utcnow().isoformat(),
                    "deleted_count": deleted_count
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"[%s] Could not write rollback state to report file: {str(e)}", self.job_id)
            
        return deleted_count

