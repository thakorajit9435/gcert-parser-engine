from pydantic import BaseModel
from typing import Optional

class Keyword(BaseModel):
    keyword_id: str
    topic_id: str
    chapter_id: str
    subject_id: str
    standard_id: str
    keyword_en: Optional[str] = None
    keyword_gu: str
    meaning_en: Optional[str] = None
    meaning_gu: str
    is_active: bool = True
