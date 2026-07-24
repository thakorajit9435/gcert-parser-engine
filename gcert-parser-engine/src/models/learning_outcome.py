from pydantic import BaseModel, Field
from typing import List, Optional

class LearningOutcome(BaseModel):
    outcome_id: str
    topic_id: str
    chapter_id: str
    subject_id: str
    standard_id: str
    outcome_text_gu: str
    bloom_level: str  # e.g., remember, understand, apply, analyze, evaluate, create
    measurable_verb_gu: str
    linked_question_ids: Optional[List[str]] = []
    is_active: bool = True
    display_order: int
