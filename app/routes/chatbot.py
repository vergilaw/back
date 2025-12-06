from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.utils.chatbot import chatbot_service
from app.utils.dependencies import get_current_user_id
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str
    source: str


class ConversationMessage(BaseModel):
    role: str  # user, assistant
    content: str
    timestamp: datetime


# ============ PUBLIC ENDPOINTS ============

@router.post("/chat", response_model=ChatResponse)
async def chat_public(data: ChatMessage):
    """
    Chat với bot (không cần đăng nhập)
    Không có context đơn hàng của user
    """
    result = await chatbot_service.chat(data.message)
    return result


# ============ AUTHENTICATED ENDPOINTS ============

@router.post("/chat/auth", response_model=ChatResponse)
async def chat_authenticated(
    data: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    Chat với bot (đã đăng nhập)
    Có context đơn hàng của user
    """
    result = await chatbot_service.chat(data.message, user_id)
    
    # Lưu conversation
    db = get_database()
    db.conversations.update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": data.message, "timestamp": datetime.utcnow()},
                        {"role": "assistant", "content": result["response"], "timestamp": datetime.utcnow()}
                    ]
                }
            },
            "$set": {"updated_at": datetime.utcnow()}
        },
        upsert=True
    )
    
    return result


@router.get("/history")
async def get_chat_history(
    limit: int = 20,
    user_id: str = Depends(get_current_user_id)
):
    """Lấy lịch sử chat của user"""
    db = get_database()
    
    conversation = db.conversations.find_one({"user_id": ObjectId(user_id)})
    
    if not conversation:
        return {"messages": []}
    
    messages = conversation.get("messages", [])[-limit:]
    
    return {
        "messages": [{
            "role": m["role"],
            "content": m["content"],
            "timestamp": m["timestamp"]
        } for m in messages]
    }


@router.delete("/history")
async def clear_chat_history(
    user_id: str = Depends(get_current_user_id)
):
    """Xóa lịch sử chat"""
    db = get_database()
    db.conversations.delete_one({"user_id": ObjectId(user_id)})
    return {"message": "Chat history cleared"}


# ============ QUICK ACTIONS ============

@router.get("/suggestions")
async def get_suggestions():
    """Gợi ý câu hỏi nhanh"""
    return {
        "suggestions": [
            "Có những loại bánh nào?",
            "Bánh nào bán chạy nhất?",
            "Giá bánh sinh nhật bao nhiêu?",
            "Cách đặt hàng như thế nào?",
            "Phí giao hàng bao nhiêu?",
            "Có khuyến mãi gì không?",
            "Địa chỉ cửa hàng ở đâu?",
            "Giờ mở cửa mấy giờ?"
        ]
    }


@router.get("/products/search")
async def search_products_for_chat(q: str, limit: int = 5):
    """Tìm sản phẩm (cho autocomplete)"""
    products = chatbot_service.search_products(q, limit)
    return {"products": products}
