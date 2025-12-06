from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from pydantic import BaseModel

from app.schemas.questions import QuestionCreate, QuestionResponse
from app.models.questions import QuestionModel
from app.database import get_database
from app.utils.dependencies import get_current_active_user, get_current_active_admin

router = APIRouter(prefix="/api/questions", tags=["Questions"])

class ReplyRequest(BaseModel):
    answer: str

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def submit_question(
    payload: QuestionCreate,
    current_user: dict = Depends(get_current_active_user)
):
    db = get_database()
    doc = QuestionModel.create_question(
        db, {**payload.dict(), "user_id": str(current_user["_id"])}
    )
    return QuestionModel.doc_to_response(doc)

@router.get("", response_model=List[QuestionResponse])
async def list_unanswered(
    current_user: dict = Depends(get_current_active_admin)
):
    db = get_database()
    docs = QuestionModel.list_unanswered(db)
    return [QuestionModel.doc_to_response(doc) for doc in docs]

@router.post("/{question_id}/reply", response_model=QuestionResponse)
async def reply_question(
    question_id: str,
    payload: ReplyRequest,
    current_user: dict = Depends(get_current_active_admin)
):
    db = get_database()
    doc = QuestionModel.reply(db, question_id, payload.answer)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return QuestionModel.doc_to_response(doc)

@router.get("/me", response_model=List[QuestionResponse])
async def my_questions(current_user: dict = Depends(get_current_active_user)):
    db = get_database()
    docs = QuestionModel.list_user_questions(db, str(current_user["_id"]))
    return [QuestionModel.doc_to_response(doc) for doc in docs]