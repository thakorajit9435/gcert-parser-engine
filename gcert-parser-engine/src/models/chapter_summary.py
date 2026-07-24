from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class KeyPoint(BaseModel):
    text_en: Optional[str] = None
    text_gu: str

class ImportantFormula(BaseModel):
    formula: str
    description_en: Optional[str] = None
    description_gu: Optional[str] = None

class DiagramReference(BaseModel):
    imageUrl: str
    caption_en: Optional[str] = None
    caption_gu: Optional[str] = None

class ChapterSummary(BaseModel):
    summary_id: str
    chapter_id: str
    standard_id: str
    subject_id: str
    summary_en: Optional[str] = None
    summary_gu: str
    key_points: List[KeyPoint] = []
    important_formulas: List[ImportantFormula] = []
    diagram_references: List[DiagramReference] = []
    revision_notes_en: Optional[str] = None
    revision_notes_gu: Optional[str] = None
    is_active: bool = True
