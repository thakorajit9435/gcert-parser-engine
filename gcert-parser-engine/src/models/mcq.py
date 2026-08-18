from pydantic import BaseModel
from typing import List, Optional

class MCQOption(BaseModel):
    id: str  # A, B, C, D
    text_gu: str

class MCQ(BaseModel):
    mcq_id: str
    topic_id: str
    chapter_id: str
    subject_id: str
    standard_id: str
    standard_number: int
    question_text_gu: str
    options: List[MCQOption]
    correct_option_id: str
    explanation_gu: Optional[str] = None
    bloom_level: str
    difficulty_level: str
    marks: int = 1
    is_verified: bool = True
    is_active: bool = True
    is_premium: bool = False
    usage_count: int = 0
