from pydantic import BaseModel
from typing import Optional

class Glossary(BaseModel):
    glossary_id: str
    subject_id: str
    topic_id: str
    standard_id: str
    standard_number: int
    subject_code: str
    word_gu: str
    word_en: Optional[str] = None
    definition_gu: str
    is_active: bool = True
