from pydantic import BaseModel, Field
from typing import Optional, List

class Topic(BaseModel):
    topic_id: str
    topic_number: int
    chapter_id: str
    subject_id: str
    standard_id: str
    standard_number: int
    title_gu: str
    title_en: Optional[str] = None
    content_type: str = "text"
    content_gu: str
    is_active: bool = True
    is_premium: bool = False
    display_order: int
    keywords: Optional[List[str]] = []
