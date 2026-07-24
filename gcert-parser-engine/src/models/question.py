from pydantic import BaseModel
from typing import Optional

class Question(BaseModel):
    question_id: str
    topic_id: str
    chapter_id: str
    subject_id: str
    standard_id: str
    standard_number: int
    question_text_gu: str
    question_type: str = "short_answer"  # e.g., short_answer, long_answer, fill_in_blanks
    answer_gu: str
    bloom_level: str
    difficulty_level: str  # e.g., easy, medium, hard
    marks: int
    is_hots: bool = False
    is_previous_year_pattern: bool = False
    is_verified: bool = True
    is_active: bool = True
    is_premium: bool = False
    usage_count: int = 0

