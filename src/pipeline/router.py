import re
import uuid
import datetime
import asyncio
import numpy as np
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from qdrant_client.http import models
from firebase_admin import firestore

from config.settings import settings
from src.core.logger import logger
from src.utils.qdrant_client import QdrantClientHelper
from src.pipeline.embedder import BGEEmbedder
from src.utils.llm_client import LLMClient

router = APIRouter(prefix="/api/v1", tags=["RAG & Embeddings Pipeline"])

# Singleton helpers
qdrant_helper = QdrantClientHelper()
embedder = BGEEmbedder()
llm_client = LLMClient()

def get_firestore_db():
    try:
        return firestore.client(database_id=settings.FIRESTORE_DATABASE_ID)
    except Exception as e:
        logger.error("Failed to acquire Firestore client: %s", str(e))
        raise HTTPException(status_code=500, detail="Database connection failed.")

def sanitize_prompt_injection(text: str) -> str:
    if not text:
        return text
    # Remove common jailbreak/override triggers to prevent prompt injection
    patterns = [
        r"(?i)ignore\s+(?:all\s+)?prior\s+instructions",
        r"(?i)ignore\s+(?:all\s+)?previous\s+instructions",
        r"(?i)system\s+override",
        r"(?i)forget\s+(?:all\s+)?previous",
        r"(?i)instead,\s+output",
        r"(?i)bypass\s+restrictions",
        r"(?i)bypass\s+rules",
    ]
    for pattern in patterns:
        text = re.sub(pattern, "[removed instruction]", text)
    return text


def _get_active_model_name() -> str:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "ollama":
        return settings.OLLAMA_MODEL
    return settings.GEMINI_MODEL



# --- Schema Definitions ---

class TopicEmbedRequest(BaseModel):
    topicId: str
    forceUpdate: bool = False

class BatchEmbedRequest(BaseModel):
    standard: Optional[str] = None
    subject: Optional[str] = None
    session: Optional[str] = None
    forceUpdate: bool = False

class SearchFilters(BaseModel):
    standard: Optional[str] = None
    session: Optional[str] = None
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    language: Optional[str] = "gu"
    isPremium: Optional[bool] = False
    pageNumber: Optional[int] = None

class SearchRequest(BaseModel):
    query: str
    filters: Optional[SearchFilters] = None
    top_k: int = Field(5, ge=1, le=50)
    min_confidence: float = Field(0.40, ge=0.0, le=1.0)

class TextbookChunk(BaseModel):
    chunkId: str
    content: str
    summary: str
    keywords: List[str]
    pageNumber: int
    difficulty: str
    learningOutcomes: List[str]
    topicId: Optional[str] = None

class SearchResultItem(BaseModel):
    confidenceScore: float
    chunk: TextbookChunk
    sourceChapter: str
    sourceTopic: str
    relatedTopics: List[str] = []

class SearchResponse(BaseModel):
    query: str
    resultsCount: int
    results: List[SearchResultItem]

class RagAskRequest(BaseModel):
    question: str = Field(..., max_length=500)
    filters: Optional[SearchFilters] = None
    stream: bool = False

class CitationItem(BaseModel):
    citationId: str
    chapter: str
    pageNumber: int
    textQuote: str

class RagAskResponse(BaseModel):
    answer: str
    citations: List[CitationItem]
    metadata: Dict[str, Any]

class ChatMessageSend(BaseModel):
    question: str = Field(..., max_length=500)
    filters: Optional[SearchFilters] = None

class ChatSessionCreate(BaseModel):
    userId: Optional[str] = None
    user_id: Optional[str] = None
    title: Optional[str] = None
    chapterId: Optional[str] = None
    chapter_id: Optional[str] = None
    subjectId: Optional[str] = None
    subject_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"

class ChatSessionBookmark(BaseModel):
    isBookmarked: bool


# --- API Routes ---

@router.get("/search/health")
async def check_qdrant_health():
    """Checks the health and connectivity of the Qdrant Vector Database."""
    try:
        client = qdrant_helper.get_client()
        collections = client.get_collections().collections
        return {
            "status": "healthy",
            "database": "Qdrant Vector DB",
            "connection": "connected",
            "collections_count": len(collections),
            "collections": [c.name for c in collections]
        }
    except Exception as e:
        logger.error("Health check failed for Qdrant: %s", str(e))
        return {
            "status": "unhealthy",
            "database": "Qdrant Vector DB",
            "connection": "failed",
            "error": str(e)
        }

@router.post("/embeddings/topics")
async def trigger_topic_re_embedding(request: TopicEmbedRequest, db=Depends(get_firestore_db)):
    """Triggers re-embedding of a single Topic from Firestore."""
    logger.info("Triggering topic re-embedding for topicId: %s", request.topicId)
    
    # 1. Fetch from Firestore (Collection: ai_knowledge_base)
    try:
        doc_ref = db.collection("ai_knowledge_base").document(f"kb_{request.topicId}")
        doc = doc_ref.get()
        if not doc.exists:
            # Try topic_id directly
            doc_ref = db.collection("ai_knowledge_base").document(request.topicId)
            doc = doc_ref.get()
            
        if not doc.exists:
            raise HTTPException(status_code=404, detail="AI Knowledge Base document not found for this topicId.")
            
        kb_data = doc.to_dict()
        
        # 2. Invoke local pipeline service to chunk & embed
        from src.pipeline.service import EmbeddingPipelineService
        service = EmbeddingPipelineService()
        indexed_count = service.process_and_index_kb_payload({"ai_knowledge_base": [kb_data]})
        
        return {
            "status": "success",
            "topicId": request.topicId,
            "chunks_indexed": indexed_count,
            "message": f"Successfully chunked and indexed {indexed_count} vectors."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to re-embed topic %s: %s", request.topicId, str(e))
        raise HTTPException(status_code=500, detail=f"Internal processing failed: {str(e)}")


@router.post("/embeddings/batch")
async def trigger_batch_re_embedding(request: BatchEmbedRequest, db=Depends(get_firestore_db)):
    """Triggers batch re-embedding of multiple topics from Firestore."""
    logger.info("Triggering batch re-embedding...")
    try:
        query = db.collection("ai_knowledge_base")
        if request.standard:
            query = query.where("standard_number", "==", int(request.standard))
        if request.subject:
            query = query.where("subject_id", "==", request.subject)
            
        docs = query.get()
        kb_list = [doc.to_dict() for doc in docs]
        
        if not kb_list:
            return {"status": "success", "chunks_indexed": 0, "message": "No matching documents found in Firestore."}
            
        from src.pipeline.service import EmbeddingPipelineService
        service = EmbeddingPipelineService()
        indexed_count = service.process_and_index_kb_payload({"ai_knowledge_base": kb_list})
        
        return {
            "status": "success",
            "topics_found": len(kb_list),
            "chunks_indexed": indexed_count,
            "message": f"Batch process complete. Indexed {indexed_count} vectors."
        }
    except Exception as e:
        logger.error("Failed to run batch embedding job: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """Executes hybrid semantic search with metadata filters."""
    logger.info("Executing semantic search for query: %s", request.query)
    
    collection_name = settings.QDRANT_COLLECTION
    client = qdrant_helper.get_client()
    
    # 1. Initialize collections if not already running
    qdrant_helper.initialize_collection()
    
    try:
        # Generate query dense vector and sparse lexical representation in thread pool
        dense_vector = await run_in_threadpool(embedder.get_dense_embedding, request.query)
        sparse_vector = await run_in_threadpool(embedder.get_sparse_embedding, request.query)
        
        must_conditions = []
        if request.filters:
            f = request.filters
            
            # Map standard to numeric string (e.g. "std_07" -> "7")
            standard_val = f.standard
            if standard_val:
                if standard_val.startswith("std_"):
                    try:
                        standard_val = str(int(standard_val.split("_")[1]))
                    except ValueError:
                        pass
                else:
                    # Clean standard value to keep only digits
                    digits = "".join(filter(str.isdigit, standard_val))
                    if digits:
                        standard_val = digits
            
            # Map subject name to Qdrant subject_id format (e.g. "Science" + "7" -> "sci_std_07")
            subject_val = f.subject
            if subject_val and standard_val:
                sub_lower = subject_val.lower()
                sub_code = None
                if "science" in sub_lower:
                    sub_code = "sci"
                elif "math" in sub_lower:
                    sub_code = "math"
                elif "guj" in sub_lower:
                    sub_code = "guj"
                elif "social" in sub_lower or "soc" in sub_lower:
                    sub_code = "soc"
                elif "english" in sub_lower or "eng" in sub_lower:
                    sub_code = "eng"
                elif "hindi" in sub_lower or "hin" in sub_lower:
                    sub_code = "hin"
                elif "computer" in sub_lower or "comp" in sub_lower:
                    sub_code = "comp"
                    
                if sub_code:
                    try:
                        std_num = int(standard_val)
                        subject_val = f"{sub_code}_std_{std_num:02d}"
                    except ValueError:
                        subject_val = f"{sub_code}_std_{standard_val}"

            if standard_val:
                must_conditions.append(models.FieldCondition(key="standard", match=models.MatchValue(value=standard_val)))
            if subject_val:
                must_conditions.append(models.FieldCondition(key="subject", match=models.MatchValue(value=subject_val)))
            if f.chapter:
                ch_val = str(f.chapter).strip()
                ch_digits = "".join(filter(str.isdigit, ch_val))
                chapter_variants = {ch_val}
                if ch_digits:
                    chapter_variants.update([ch_digits, f"ch_{ch_digits}", f"Chapter {ch_digits}", f"પ્રકરણ {ch_digits}"])
                must_conditions.append(models.FieldCondition(key="chapter", match=models.MatchAny(any=list(chapter_variants))))
            if f.topic:
                must_conditions.append(models.FieldCondition(key="topic", match=models.MatchValue(value=f.topic)))
            if f.difficulty:
                must_conditions.append(models.FieldCondition(key="difficulty", match=models.MatchValue(value=f.difficulty)))
            if f.language:
                must_conditions.append(models.FieldCondition(key="language", match=models.MatchValue(value=f.language)))
            if f.isPremium is not None:
                must_conditions.append(models.FieldCondition(key="isPremium", match=models.MatchValue(value=f.isPremium)))
            if f.pageNumber:
                must_conditions.append(models.FieldCondition(key="pageNumber", match=models.MatchValue(value=f.pageNumber)))
                
        query_filter = models.Filter(must=must_conditions) if must_conditions else None
        
        # Query Qdrant using hybrid retrieval (Prefetch + Fusion RRF)
        # BAAI/bge-m3 handles late fusion scores. We prefetch from both indices.
        candidates = client.query_points(
            collection_name=collection_name,
            prefetch=[
                models.Prefetch(
                    query=dense_vector,
                    using="dense-bge-m3",
                    limit=request.top_k * 2
                ),
                models.Prefetch(
                    query=models.SparseVector(
                        indices=sparse_vector["indices"],
                        values=sparse_vector["values"]
                    ),
                    using="sparse-bge-m3",
                    limit=request.top_k * 2
                )
            ],
            query=models.FusionQuery(
                fusion=models.Fusion.RRF
            ),
            query_filter=query_filter,
            limit=request.top_k * 3
        )

        # Single-pass relaxed retrieval if filtered search returned 0 candidates
        if not candidates.points and query_filter is not None:
            logger.info("Filtered search returned 0 candidates. Re-using embeddings for single-pass relaxed search...")
            candidates = client.query_points(
                collection_name=collection_name,
                prefetch=[
                    models.Prefetch(
                        query=dense_vector,
                        using="dense-bge-m3",
                        limit=request.top_k * 2
                    ),
                    models.Prefetch(
                        query=models.SparseVector(
                            indices=sparse_vector["indices"],
                            values=sparse_vector["values"]
                        ),
                        using="sparse-bge-m3",
                        limit=request.top_k * 2
                    )
                ],
                query=models.FusionQuery(
                    fusion=models.Fusion.RRF
                ),
                limit=request.top_k * 3
            )
        
        # Prepare candidates for re-ranking
        raw_candidates = []
        for point in candidates.points:
            p = point.payload
            raw_candidates.append({
                "point": point,
                "text": p.get("textChunk", ""),
                "score": float(point.score) if point.score is not None else 0.5
            })
            
        # Re-rank candidates in thread pool
        reranked = await run_in_threadpool(embedder.rerank, request.query, raw_candidates)
        
        # Format results and apply min_confidence thresholding
        results = []
        for c in reranked:
            score = c["score"]
            if score < request.min_confidence:
                continue
                
            point = c["point"]
            p = point.payload
            chunk = TextbookChunk(
                chunkId=point.id if isinstance(point.id, str) else str(point.id),
                content=p.get("textChunk", ""),
                summary=p.get("summary", "કોઈ સારાંશ નથી"),
                keywords=p.get("keywords", []),
                pageNumber=p.get("pageNumber", 1),
                difficulty=p.get("difficulty", "medium"),
                learningOutcomes=p.get("learningOutcomes", []),
                topicId=p.get("topicId")
            )
            
            item = SearchResultItem(
                confidenceScore=round(score, 3),
                chunk=chunk,
                sourceChapter=p.get("chapter", "unknown_chapter"),
                sourceTopic=p.get("topic", "unknown_topic"),
                relatedTopics=p.get("relatedTopics", [])
            )
            results.append(item)
            if len(results) >= request.top_k:
                break
                
        return SearchResponse(
            query=request.query,
            resultsCount=len(results),
            results=results
        )
    except Exception as e:
        logger.error("Qdrant Search execution failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Search execution error: {str(e)}")


import time
from threading import Lock

class SimpleTTLCache:
    def __init__(self, maxsize: int = 1000, ttl_seconds: int = 300):
        self.maxsize = maxsize
        self.ttl = ttl_seconds
        self.cache = {}
        self.lock = Lock()

    def get(self, key):
        with self.lock:
            if key not in self.cache:
                return None
            val, expiry = self.cache[key]
            if time.time() > expiry:
                del self.cache[key]
                return None
            return val

    def set(self, key, value):
        with self.lock:
            now = time.time()
            expired_keys = [k for k, (_, exp) in self.cache.items() if now > exp]
            for k in expired_keys:
                del self.cache[k]

            if len(self.cache) >= self.maxsize:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]

            self.cache[key] = (value, now + self.ttl)

    def __contains__(self, key):
        return self.get(key) is not None

    def __getitem__(self, key):
        val = self.get(key)
        if val is None:
            raise KeyError(key)
        return val

    def __setitem__(self, key, value):
        self.set(key, value)

_topic_metadata_cache = {}

async def build_rag_context(search_results, db):
    context_blocks = []
    citations_map = {}
    
    # Parallel fetch all topic metadata from Firestore at once with in-memory caching
    async def _fetch_topic_metadata(topic_id):
        if not topic_id:
            return None
        if topic_id in _topic_metadata_cache:
            return _topic_metadata_cache[topic_id]
        try:
            kb_snap = await run_in_threadpool(db.collection("ai_knowledge_base").document(topic_id).get)
            if kb_snap.exists:
                data = kb_snap.to_dict()
                _topic_metadata_cache[topic_id] = data
                return data
        except Exception as ex:
            logger.error("Failed to fetch topic metadata from Firestore for %s: %s", topic_id, str(ex))
        return None
    
    # Gather all topic metadata fetches in parallel
    topic_ids = [item.chunk.topicId for item in search_results]
    import asyncio
    metadata_tasks = [
        _fetch_topic_metadata(tid) if tid else asyncio.coroutine(lambda: None)() 
        if False else asyncio.ensure_future(_fetch_topic_metadata(tid)) if tid else None
        for tid in topic_ids
    ]
    # Filter out None tasks and gather
    valid_tasks = [(i, t) for i, t in enumerate(metadata_tasks) if t is not None]
    if valid_tasks:
        indices, tasks = zip(*valid_tasks)
        results = await asyncio.gather(*tasks, return_exceptions=True)
        metadata_map = {}
        for idx_pos, result in zip(indices, results):
            if isinstance(result, Exception) or result is None:
                metadata_map[idx_pos] = None
            else:
                metadata_map[idx_pos] = result
    else:
        metadata_map = {}
    
    for idx, item in enumerate(search_results):
        cid = f"doc_gcert_{idx+1}"
        
        revision_notes = []
        glossary = []
        topic_title = item.sourceTopic
        
        kb_data = metadata_map.get(idx)
        if kb_data:
            revision_notes = kb_data.get("revision_notes", [])
            glossary = kb_data.get("glossary", [])
            topic_title = kb_data.get("title_gu", topic_title)
        
        snippet_lines = [
            f"---\nDocument ID: {cid}",
            f"Topic Title: {topic_title}",
            f"Chapter: {item.sourceChapter}",
            f"Page Number: {item.chunk.pageNumber}"
        ]
        if revision_notes:
            notes_str = ", ".join(revision_notes)
            snippet_lines.append(f"Revision Notes (Objectives): {notes_str}")
        if glossary:
            glossary_str = ", ".join([f"{g.get('term', '')}: {g.get('definition', '')}" for g in glossary if isinstance(g, dict)])
            if glossary_str:
                snippet_lines.append(f"Glossary: {glossary_str}")
        snippet_lines.append(f"Content: {item.chunk.content}\n---")
        
        context_blocks.append("\n".join(snippet_lines))
        
        citations_map[cid] = CitationItem(
            citationId=item.chunk.chunkId,
            chapter=item.sourceChapter,
            pageNumber=item.chunk.pageNumber,
            textQuote=item.chunk.content[:200] + "..."
        )
    return "\n\n".join(context_blocks), citations_map

# Simple global in-memory cache for queries to bypass semantic search and LLM calls for speed
_rag_cache = SimpleTTLCache(maxsize=1000, ttl_seconds=300)

@router.post("/rag/ask", response_model=RagAskResponse)
async def rag_ask(request: RagAskRequest, db=Depends(get_firestore_db)):
    """Executes closed-domain RAG answer generation from GCERT textbooks with fallback & cache."""
    request.question = sanitize_prompt_injection(request.question)
    logger.info("Executing RAG Ask pipeline for question: %s", request.question)
    
    # Check cache first to respond instantly
    filters_key = ""
    if request.filters:
        filters_key = f"{request.filters.standard}_{request.filters.subject}_{request.filters.chapter}_{request.filters.language}"
    cache_key = f"rag_{request.question}_{filters_key}"
    if cache_key in _rag_cache:
        logger.info("Serving RAG Ask response from cache instantly.")
        return _rag_cache[cache_key]



    try:
        # 1. Fetch relevant chunks from semantic search
        search_req = SearchRequest(
            query=request.question,
            filters=request.filters,
            top_k=4,
            min_confidence=0.25 # Lower threshold to check context availability
        )
        search_res = await semantic_search(search_req)
        
        # Fallback to global search if no filtered results found
        if not search_res.results and request.filters and (request.filters.standard or request.filters.subject):
            logger.info("No filtered results found for rag_ask. Retrying with global search (relaxed filters)...")
            fallback_filters = SearchFilters(language=request.filters.language)
            fallback_req = SearchRequest(
                query=request.question,
                filters=fallback_filters,
                top_k=4,
                min_confidence=0.25
            )
            search_res = await semantic_search(fallback_req)
            
        # 2. Build context block if search results found
        if search_res.results:
            context_str, citations_map = await build_rag_context(search_res.results, db)
            context_block = f"[GCERT TEXTBOOK CONTEXT START]\n{context_str}\n[GCERT TEXTBOOK CONTEXT END]\n\n"
        else:
            context_str, citations_map = "", {}
            context_block = ""

        # 3. Formulate Prompt
        system_instruction = (
            "You are GyanDeep AI, a helpful, expert educational assistant for GCERT (Gujarat State Board) students.\n"
            "Follow these rules strictly:\n"
            "1. Answer the student's question accurately, completely, and warmly in clear Gujarati, strictly focused on the requested chapter.\n"
            "2. If [GCERT TEXTBOOK CONTEXT] is provided below, prioritize that content and insert inline document citations (e.g. [doc_gcert_1]) directly behind referenced facts.\n"
            "3. If [GCERT TEXTBOOK CONTEXT] is empty or incomplete, use your core educational knowledge of the GCERT curriculum for this specific chapter to provide a full, accurate, and helpful response in Gujarati.\n"
            "4. For MCQ / Quiz requests, generate 5 clear multiple-choice questions with options (A, B, C, D) and correct answers with explanations in Gujarati.\n"
            "5. ALWAYS end your response with a citation line in Gujarati format:\n"
            "📍 **પ્રકરણ:** [Chapter Title] | 📄 **પૃષ્ઠ ક્રમાંક:** [Page Number]"
        )

        prompt = (
            f"{context_block}"
            f"વિદ્યાર્થી પ્રશ્ન: {request.question}\nગુજરાતી ઉત્તર:"
        )

        # 4. Call Gemini RAG Generator
        raw_answer = await run_in_threadpool(llm_client.generate_rag_response, system_instruction, prompt)

        if not raw_answer:
            raw_answer = "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને થોડીવાર પછી ફરીથી પ્રયત્ન કરો."

        # 5. Parse and filter citations present in the answer
        active_citations = []
        if citations_map:
            for doc_key, citation_item in citations_map.items():
                if doc_key in raw_answer:
                    active_citations.append(citation_item)

        avg_confidence = float(np.mean([r.confidenceScore for r in search_res.results])) if search_res.results else 0.0
        res = RagAskResponse(
            answer=raw_answer,
            citations=active_citations,
            metadata={
                "status": "success",
                "model": _get_active_model_name(),
                "source": "textbook_rag" if search_res.results else "general_curriculum_llm",
                "avg_retrieval_confidence": round(avg_confidence, 3)
            }
        )
        _rag_cache[cache_key] = res
        return res
        
    except Exception as e:
        logger.error("RAG Ask execution failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"RAG processing error: {str(e)}")


# --- Chat History & Session APIs ---

@router.post("/chat/sessions")
async def create_chat_session(request: ChatSessionCreate, db=Depends(get_firestore_db)):
    """Initializes a new AI chat history session in Firestore."""
    try:
        session_id = str(uuid.uuid4())
        user_id = request.userId or request.user_id or "admin"
        title = request.title or "AI Session"
        metadata = request.metadata or {}

        if request.chapterId or request.chapter_id:
            metadata["chapterId"] = request.chapterId or request.chapter_id
        if request.subjectId or request.subject_id:
            metadata["subjectId"] = request.subjectId or request.subject_id

        doc_data = {
            "userId": user_id,
            "title": title,
            "isBookmarked": False,
            "isDeleted": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "metadata": metadata
        }
        db.collection("chat_sessions").document(session_id).set(doc_data)
        return {
            "status": "success",
            "sessionId": session_id,
            "message": "Chat session created."
        }
    except Exception as e:
        logger.error("Failed to create chat session: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/chat/sessions/{sessionId}/bookmark")
async def bookmark_chat_session(sessionId: str, request: ChatSessionBookmark, db=Depends(get_firestore_db)):
    """Bookmarks or unbookmarks a chat session in Firestore."""
    try:
        doc_ref = db.collection("chat_sessions").document(sessionId)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Chat session not found.")
            
        doc_ref.update({
            "isBookmarked": request.isBookmarked,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })
        return {
            "status": "success",
            "sessionId": sessionId,
            "isBookmarked": request.isBookmarked
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update bookmark state: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/chat/sessions/{sessionId}")
async def soft_delete_chat_session(sessionId: str, db=Depends(get_firestore_db)):
    """Performs a soft-delete (hiding from view list) on a chat session."""
    try:
        doc_ref = db.collection("chat_sessions").document(sessionId)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Chat session not found.")
            
        doc_ref.update({
            "isDeleted": True,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })
        return {
            "status": "success",
            "sessionId": sessionId,
            "message": "Session soft deleted."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to soft-delete chat session: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/sessions/{sessionId}/messages")
async def send_chat_message(sessionId: str, request: ChatMessageSend, db=Depends(get_firestore_db)):
    """Sends a question to a chat session, triggers RAG with fallback, and saves the answer in Firestore."""
    request.question = sanitize_prompt_injection(request.question)
    logger.info("Sending chat message to session %s: %s", sessionId, request.question)
    
    # 1. Fetch Session
    session_ref = db.collection("chat_sessions").document(sessionId)
    session_snap = await run_in_threadpool(session_ref.get)
    if not session_snap.exists:
        raise HTTPException(status_code=404, detail="Chat session not found.")
        
    try:
        # Check cache first for instantaneous reply content
        filters_key = ""
        if request.filters:
            filters_key = f"{request.filters.standard}_{request.filters.subject}_{request.filters.chapter}_{request.filters.language}"
        cache_key = f"chat_{request.question}_{filters_key}"
        
        raw_answer = None
        active_citations = []
        cached_hit = False

        if cache_key in _rag_cache:
            logger.info("Serving chat answer from cache instantly.")
            cached_res = _rag_cache[cache_key]
            raw_answer = cached_res.answer
            # Map CitationItem back to dynamic objects if needed
            active_citations = cached_res.citations
            cached_hit = True

        # 2. Write User Message to Firestore (async non-blocking background task)
        user_msg_id = str(uuid.uuid4())
        user_msg_data = {
            "role": "user",
            "content": request.question,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "language": request.filters.language if request.filters else "gu"
        }
        asyncio.create_task(run_in_threadpool(session_ref.collection("messages").document(user_msg_id).set, user_msg_data))

        if not cached_hit:
            # 3. Fetch Context (same as RAG Ask)
            search_req = SearchRequest(
                query=request.question,
                filters=request.filters,
                top_k=4,
                min_confidence=0.25
            )
            search_res = await semantic_search(search_req)
            
            # Fallback to global search if no filtered results found
            if not search_res.results and request.filters and (request.filters.standard or request.filters.subject):
                logger.info("No filtered results found for chat messages. Retrying with global search (relaxed filters)...")
                fallback_filters = SearchFilters(language=request.filters.language)
                fallback_req = SearchRequest(
                    query=request.question,
                    filters=fallback_filters,
                    top_k=4,
                    min_confidence=0.25
                )
                search_res = await semantic_search(fallback_req)
                
            if search_res.results:
                context_str, citations_map = await build_rag_context(search_res.results, db)
                context_block = f"[GCERT TEXTBOOK CONTEXT START]\n{context_str}\n[GCERT TEXTBOOK CONTEXT END]\n\n"
            else:
                context_str, citations_map = "", {}
                context_block = ""

            system_instruction = (
                "You are GyanDeep AI, a helpful, expert educational assistant for GCERT (Gujarat State Board) students.\n"
                "Follow these rules strictly:\n"
                "1. Answer the student's question accurately, completely, and warmly in clear Gujarati, strictly focused on the requested chapter.\n"
                "2. If [GCERT TEXTBOOK CONTEXT] is provided below, prioritize that content and insert inline document citations (e.g. [doc_gcert_1]) directly behind referenced facts.\n"
                "3. If [GCERT TEXTBOOK CONTEXT] is empty or incomplete, use your core educational knowledge of the GCERT curriculum for this specific chapter to provide a full, accurate, and helpful response in Gujarati.\n"
                "4. For MCQ / Quiz requests, generate 5 clear multiple-choice questions with options (A, B, C, D) and correct answers with explanations in Gujarati.\n"
                "5. ALWAYS end your response with a citation line in Gujarati format:\n"
                "📍 **પ્રકરણ:** [Chapter Title] | 📄 **પૃષ્ઠ ક્રમાંક:** [Page Number]"
            )

            prompt = (
                f"{context_block}"
                f"વિદ્યાર્થી પ્રશ્ન: {request.question}\nગુજરાતી ઉત્તર:"
            )

            try:
                raw_answer = await asyncio.wait_for(
                    run_in_threadpool(llm_client.generate_rag_response, system_instruction, prompt),
                    timeout=35.0
                )
            except asyncio.TimeoutError:
                logger.warning("LLM RAG response timed out after 35s in chat endpoint.")
                raw_answer = "માફ કરશો, AI જવાબ મેળવવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ફરીથી પ્રયત્ન કરો."

            if not raw_answer:
                raw_answer = "માફ કરશો, AI ઉત્તર મેળવવામાં સમસ્યા આવી છે. કૃપા કરીને થોડીવાર પછી ફરીથી પ્રયત્ન કરો."

            active_citations = []
            if citations_map:
                for doc_key, citation_item in citations_map.items():
                    if doc_key in raw_answer:
                        active_citations.append(citation_item)

            # Determine average confidence score
            avg_confidence = float(np.mean([r.confidenceScore for r in search_res.results])) if search_res.results else 0.0

            # Store in cache
            _rag_cache[cache_key] = RagAskResponse(
                answer=raw_answer,
                citations=active_citations,
                metadata={
                    "status": "success",
                    "model": _get_active_model_name(),
                    "avg_retrieval_confidence": round(avg_confidence, 3)
                }
            )
        else:
            # Retrieve from cache metadata
            avg_confidence = 0.0
            if cache_key in _rag_cache:
                cached_res = _rag_cache[cache_key]
                if isinstance(cached_res, RagAskResponse):
                    avg_confidence = cached_res.metadata.get("avg_retrieval_confidence", 0.0)

        # 4. Write Assistant Message & Update Session Metadata in background task (non-blocking for UI response)
        assistant_msg_id = str(uuid.uuid4())
        assistant_msg_data = {
            "role": "assistant",
            "content": raw_answer,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "aiModel": _get_active_model_name(),
            "retrievedChunks": [
                {
                    "chunkId": cit.citationId,
                    "chapter": cit.chapter,
                    "pageNumber": cit.pageNumber,
                    "textQuote": cit.textQuote
                } for cit in active_citations
            ],
            "references": [cit.citationId for cit in active_citations],
            "retrievalConfidence": round(avg_confidence, 3)
        }
        
        session_data = session_snap.to_dict() or {}
        update_fields = {"updatedAt": firestore.SERVER_TIMESTAMP}
        if session_data.get("title") == "New Session" or not session_data.get("title"):
            update_fields["title"] = request.question[:30] + "..." if len(request.question) > 30 else request.question

        def _persist_assistant_data():
            try:
                session_ref.collection("messages").document(assistant_msg_id).set(assistant_msg_data)
                session_ref.update(update_fields)
            except Exception as persist_err:
                logger.error("Non-blocking Firestore persistence error: %s", str(persist_err))

        asyncio.create_task(run_in_threadpool(_persist_assistant_data))
        
        return {
            "answer": raw_answer,
            "citations": active_citations,
            "metadata": {
                "status": "success",
                "model": _get_active_model_name(),
                "avg_retrieval_confidence": round(avg_confidence, 3)
            }
        }
    except Exception as e:
        logger.error("Failed to process chat message: %s", str(e))
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {str(e)}")


# --- Quiz Explanation Schema ---

class QuizExplainRequest(BaseModel):
    question: str = Field(..., max_length=500)
    options: List[str]
    correctAnswerIndex: int
    selectedAnswerIndex: int
    language: str = "gu"

class QuizExplainResponse(BaseModel):
    explanation: str


@router.post("/quiz/explain", response_model=QuizExplainResponse)
async def quiz_explain(request: QuizExplainRequest):
    """Generates a detailed educational explanation in Gujarati for a quiz question."""
    request.question = sanitize_prompt_injection(request.question)
    logger.info("Generating AI explanation for MCQ question: %s", request.question)
    
    options_str = "\n".join([f"{idx}. {opt}" for idx, opt in enumerate(request.options)])
    correct_opt = request.options[request.correctAnswerIndex] if 0 <= request.correctAnswerIndex < len(request.options) else "Unknown"
    selected_opt = request.options[request.selectedAnswerIndex] if 0 <= request.selectedAnswerIndex < len(request.options) else "Unknown"
    
    system_instruction = (
        "You are GyanDeep AI, a helpful school teacher.\n"
        "Explain multiple-choice questions to a student in Gujarati using a clear, encouraging tone."
    )
    prompt = (
        f"Question: {request.question}\n"
        f"Options:\n{options_str}\n"
        f"Correct Answer: {correct_opt}\n"
        f"Student Selected Option: {selected_opt}\n\n"
        "Instructions:\n"
        "1. Explain why the correct option is the right answer.\n"
        "2. If the student selected a wrong option, gently explain why that option is incorrect.\n"
        "3. Provide the entire explanation in natural, standard Gujarati.\n"
        "4. Keep the explanation concise (within 3-5 sentences) and easy for a student to understand."
    )
    
    try:
        explanation = await run_in_threadpool(
            llm_client.generate_rag_response,
            system_instruction=system_instruction,
            prompt=prompt
        )
        return QuizExplainResponse(explanation=explanation)
    except Exception as e:
        logger.error("Failed to generate quiz explanation: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to generate explanation.")


# --- Multimodal Image Doubt Schema ---

class MultimodalDoubtRequest(BaseModel):
    image_base64: str
    question: Optional[str] = "આ પ્રશ્ન સમજાવો."
    mime_type: Optional[str] = "image/jpeg"

class MultimodalDoubtResponse(BaseModel):
    answer: str


@router.post("/chat/multimodal", response_model=MultimodalDoubtResponse)
async def chat_multimodal(request: MultimodalDoubtRequest):
    """Answers textbook query from an uploaded/captured image using the configured LLM (Gemini or OpenAI-compatible)."""
    logger.info("Processing multimodal image doubt query")
    
    try:
        import base64
        
        prompt = (
            "You are GyanDeep AI, a helpful school teacher.\n"
            "Review this image containing educational content or a textbook question.\n"
            "Identify the question or topic shown in the image and explain it in detail.\n"
            "Follow these rules strictly:\n"
            "1. Answer in natural, standard Gujarati with a friendly, encouraging tone.\n"
            "2. Keep the explanation easy for school students to understand.\n"
            "3. If the image is blurred or contains non-educational content, politely ask the student to send a clearer photo of their textbook page."
        )
        if request.question:
            prompt += f"\nThe student also asked: {request.question}"

        provider = settings.LLM_PROVIDER.lower()
        
        if provider == "ollama":
            try:
                from openai import OpenAI
                client = OpenAI(api_key="ollama", base_url=settings.OLLAMA_BASE_URL or "http://localhost:11434/v1")
                
                # Format image as a data URL for Ollama vision models
                mime_type = request.mime_type or "image/jpeg"
                image_data_url = f"data:{mime_type};base64,{request.image_base64}"
                
                response = await run_in_threadpool(
                    client.chat.completions.create,
                    model=settings.OLLAMA_MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_data_url
                                    }
                                }
                            ]
                        }
                    ]
                )
                answer = response.choices[0].message.content.strip()
                return MultimodalDoubtResponse(answer=answer)
            except Exception as ollama_err:
                if settings.GEMINI_API_KEY:
                    logger.warning(f"Ollama vision call failed ({str(ollama_err)}). Falling back to Gemini...")
                    import google.generativeai as genai
                    genai.configure(api_key=settings.GEMINI_API_KEY)
                    image_bytes = base64.b64decode(request.image_base64)
                    image_part = {
                        "mime_type": request.mime_type or "image/jpeg",
                        "data": image_bytes
                    }
                    model = genai.GenerativeModel(settings.GEMINI_MODEL)
                    response = await run_in_threadpool(model.generate_content, [prompt, image_part])
                    return MultimodalDoubtResponse(answer=response.text.strip())
                raise ollama_err
            
        else:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            image_bytes = base64.b64decode(request.image_base64)
            image_part = {
                "mime_type": request.mime_type or "image/jpeg",
                "data": image_bytes
            }
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = await run_in_threadpool(model.generate_content, [prompt, image_part])
            return MultimodalDoubtResponse(answer=response.text.strip())
    except Exception as e:
        logger.error("Multimodal doubt solving failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to process image query.")
