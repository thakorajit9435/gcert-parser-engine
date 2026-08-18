from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class KBFormula(BaseModel):
    name_gu: Optional[str] = None
    latex_formula: str
    explanation_gu: Optional[str] = None

class KBActivity(BaseModel):
    title_gu: str
    objective_gu: Optional[str] = None
    procedure_gu: Optional[str] = None

class KBQuestion(BaseModel):
    question_gu: str
    answer_gu: str
    marks: int
    is_hots: bool = False

class KBGlossary(BaseModel):
    word_gu: str
    word_en: Optional[str] = None
    definition_gu: str

class RAGMetadata(BaseModel):
    chunking_strategy: str = "semantic_topic"
    tokens_count: Optional[int] = None
    embedding_model: str = "text-embedding-004"
    last_indexed_at: Optional[str] = None
    source_pdf_hash: Optional[str] = None
    tags: List[str] = []

class AIKnowledgeBase(BaseModel):
    kb_id: str = Field(description="Unique KB document key, usually matching topic_id or chunk_id")
    standard_id: str
    standard_number: int
    session: str
    subject_id: str
    chapter_id: str
    topic_id: str
    topic_number: int
    title_gu: str
    title_en: Optional[str] = None
    content_gu: str
    content_en: Optional[str] = None
    keywords: List[str] = []
    learning_outcomes: List[str] = []
    important_questions: List[KBQuestion] = []
    glossary: List[KBGlossary] = []
    formulas: List[KBFormula] = []
    activities: List[KBActivity] = []
    revision_notes: List[str] = []
    difficulty_level: str = "medium"  # easy, medium, hard
    page_numbers: List[int] = []
    related_topics: List[str] = []
    
    # --- RAG & Vector Search Optimization Fields (Pre-structured) ---
    embedding: Optional[List[float]] = Field(default=None, description="Optional vector embedding representation of content_gu")
    vector_id: Optional[str] = Field(default=None, description="Vector Database ID, e.g., Pinecone/Milvus index key")
    chunk_id: Optional[str] = Field(default=None, description="Granular chunk identifier")
    llm_metadata: RAGMetadata = Field(default_factory=RAGMetadata)
    
    # Audit trail
    isDeleted: bool = False
    is_active: bool = True
