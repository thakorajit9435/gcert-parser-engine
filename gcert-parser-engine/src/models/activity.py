from pydantic import BaseModel
from typing import List, Optional

class Activity(BaseModel):
    activity_id: str
    topic_id: str
    chapter_id: str
    subject_id: str
    standard_id: str
    title_en: Optional[str] = None
    title_gu: str
    instructions_en: Optional[str] = None
    instructions_gu: str
    materials_needed: List[str] = []
    duration_minutes: Optional[int] = None
    activity_type: str = "experiment"  # e.g., experiment, exercise, project
    is_active: bool = True
