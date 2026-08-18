import uuid
from typing import Dict, Any, List
from qdrant_client.http import models
from src.utils.qdrant_client import QdrantClientHelper
from src.pipeline.embedder import BGEEmbedder
from src.pipeline.text_processor import TextBookChunker
from src.core.logger import logger
from config.settings import settings

class EmbeddingPipelineService:
    def __init__(self):
        self.qdrant_helper = QdrantClientHelper()
        self.embedder = BGEEmbedder()
        self.chunker = TextBookChunker()

    def process_and_index_kb_payload(self, payload: Dict[str, Any]) -> int:
        """Processes AI Knowledge Base records, extracts chunks, generates embeddings, and indexes them in Qdrant."""
        # 1. Initialize Qdrant collection on demand
        self.qdrant_helper.initialize_collection()
        client = self.qdrant_helper.get_client()
        collection_name = settings.QDRANT_COLLECTION

        kb_docs = payload.get("ai_knowledge_base", [])
        if not kb_docs:
            logger.info("No AI Knowledge Base documents found in payload to embed.")
            return 0

        logger.info("Processing %d AI Knowledge Base documents for vector indexing...", len(kb_docs))
        indexed_count = 0
        points_to_upsert = []

        for kb_doc in kb_docs:
            chunks = self.chunker.process_kb_to_chunks(kb_doc)
            logger.info("Generated %d chunks for topic: %s", len(chunks), kb_doc.get("topic_id"))

            for chunk in chunks:
                chunk_id = chunk["chunk_id"]
                text_chunk = chunk["text_chunk"]
                
                # Check duplication/changes in Qdrant (Optional optimization)
                try:
                    # Deterministic UUID based on chunk_id string to support updates/overwrites
                    point_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id))
                    
                    # Generate Dense and Sparse embeddings
                    dense_vector = self.embedder.get_dense_embedding(text_chunk)
                    sparse_vector = self.embedder.get_sparse_embedding(text_chunk)

                    # Build Qdrant Point
                    point = models.PointStruct(
                        id=point_uuid,
                        vector={
                            "dense-bge-m3": dense_vector,
                            "sparse-bge-m3": models.SparseVector(
                                indices=sparse_vector["indices"],
                                values=sparse_vector["values"]
                            )
                        },
                        payload={
                            "topicId": chunk["topicId"],
                            "fieldType": chunk["field"],
                            "textChunk": text_chunk,
                            "hash": chunk["hash"],
                            "standard": chunk["metadata"].get("standard", "10"),
                            "session": chunk["metadata"].get("session", "2026-27"),
                            "subject": chunk["metadata"].get("subject", "Mathematics"),
                            "chapter": chunk["metadata"].get("chapter", "unknown_chapter"),
                            "topic": chunk["metadata"].get("topic", "unknown_topic"),
                            "difficulty": chunk["metadata"].get("difficulty", "medium"),
                            "language": chunk["metadata"].get("language", "gu"),
                            "isPremium": chunk["metadata"].get("isPremium", False),
                            "pageNumber": chunk["metadata"].get("pageNumber", 1),
                            "embeddingModel": chunk["metadata"].get("embeddingModel", "BAAI/bge-m3"),
                            "embeddingVersion": chunk["metadata"].get("embeddingVersion", "v1.0.0")
                        }
                    )
                    points_to_upsert.append(point)
                    indexed_count += 1
                except Exception as e:
                    logger.error("Failed to prepare vector point for chunk %s: %s", chunk_id, str(e))

        # Commit points to Qdrant in batches of 100
        if points_to_upsert:
            try:
                logger.info("Upserting %d points to Qdrant collection '%s'...", len(points_to_upsert), collection_name)
                for i in range(0, len(points_to_upsert), 100):
                    batch = points_to_upsert[i:i + 100]
                    client.upsert(
                        collection_name=collection_name,
                        points=batch
                    )
                logger.info("Successfully indexed %d vector points in Qdrant.", len(points_to_upsert))
            except Exception as e:
                logger.error("Failed to commit vectors to Qdrant: %s", str(e))

        return indexed_count
