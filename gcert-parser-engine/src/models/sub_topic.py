from pydantic import BaseModel, Field
from typing import Optional

class SubTopic(BaseModel):
    sub_topic_id: str
    topic_id: str
    title_en: Optional[str] = None
    title_gu: str
    display_order: int
    is_active: bool = True
