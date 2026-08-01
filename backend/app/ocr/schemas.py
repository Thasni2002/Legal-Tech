from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OcrResultOut(BaseModel):
    id: int
    case_id: Optional[int] = None
    original_filename: str
    file_type: Optional[str] = None
    extracted_text: Optional[str] = None
    languages_used: Optional[str] = None
    page_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
