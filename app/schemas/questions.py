from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class QuestionCreate(BaseModel):
    subject: str
    department: str
    question: str

class QuestionResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    department: str
    question: str
    answer: Optional[str]
    answered: bool
    created_at: datetime
    updated_at: datetime