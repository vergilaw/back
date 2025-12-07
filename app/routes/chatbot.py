from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import google.generativeai as genai
import base64

from app.utils.chatbot import chatbot_service
from app.utils.dependencies import get_current_user_id
from app.database import get_database
from app.config import settings
from bson import ObjectId

# Configure Gemini for image recognition
genai.configure(api_key=settings.GEMINI_API_KEY)
vision_model = genai.GenerativeModel('gemini-2.0-flash')

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatMessage(BaseModel):
    message: str


class DetectedProduct(BaseModel):
    id: str
    name: str
    price: float
    category: str
    image: str = ""
    match_score: int = 0


class ChatResponse(BaseModel):
    response: str
    intent: str
    source: str
    products: List[DetectedProduct] = []


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


# ============ CAMERA / IMAGE RECOGNITION ============

class ImageRecognitionRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class RecognizedProduct(BaseModel):
    id: str
    name: str
    price: float
    category: str
    description: str = ""
    image: str = ""


class ImageRecognitionResponse(BaseModel):
    found: bool
    message: str
    product: Optional[RecognizedProduct] = None
    redirect_url: Optional[str] = None


def get_all_product_names() -> List[str]:
    """Lấy danh sách tên sản phẩm"""
    db = get_database()
    products = db.products.find({"is_available": True}, {"name": 1})
    return [p["name"] for p in products]


def find_product_by_name(name: str) -> Optional[dict]:
    """Tìm sản phẩm theo tên"""
    db = get_database()
    product = db.products.find_one({
        "name": {"$regex": name, "$options": "i"},
        "is_available": True
    })
    if product:
        return {
            "id": str(product["_id"]),
            "name": product["name"],
            "price": product["price"],
            "category": product["category"],
            "description": product.get("description", ""),
            "image": product.get("image", "")
        }
    return None


@router.post("/camera", response_model=ImageRecognitionResponse)
async def recognize_cake_from_camera(file: UploadFile = File(...)):
    """
    Nhận diện bánh từ ảnh camera (upload file)
    
    - Chụp ảnh bánh và upload
    - AI phân tích và tìm sản phẩm tương ứng
    - Trả về thông tin để chuyển hướng đến trang sản phẩm
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File phải là ảnh")
    
    image_data = await file.read()
    
    product_names = get_all_product_names()
    product_list = "\n".join([f"- {name}" for name in product_names])
    
    prompt = f"""Bạn là chuyên gia nhận diện bánh ngọt của Sweet Bakery.

Nhiệm vụ: Phân tích ảnh và xác định đây là loại bánh gì.

Danh sách sản phẩm của cửa hàng:
{product_list}

Quy tắc:
1. Nếu bánh trong ảnh KHỚP với sản phẩm trong danh sách, trả về TÊN CHÍNH XÁC của sản phẩm đó
2. Nếu KHÔNG KHỚP hoặc không phải bánh, trả về "NOT_FOUND"
3. Chỉ trả về 1 dòng duy nhất, không giải thích

Phân tích ảnh và trả lời:"""

    try:
        response = vision_model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": image_data}
        ])
        
        result = response.text.strip()
        print(f"[Camera] Gemini result: {result}")
        
        if result == "NOT_FOUND" or not result:
            return ImageRecognitionResponse(
                found=False,
                message="Không tìm thấy sản phẩm tương ứng trong cửa hàng"
            )
        
        product = find_product_by_name(result)
        
        if product:
            return ImageRecognitionResponse(
                found=True,
                message=f"Đã nhận diện: {product['name']}",
                product=RecognizedProduct(**product),
                redirect_url=f"/products/{product['id']}"
            )
        else:
            return ImageRecognitionResponse(
                found=False,
                message=f"Không tìm thấy '{result}' trong cửa hàng"
            )
            
    except Exception as e:
        print(f"[Camera] Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi phân tích ảnh")


@router.post("/camera/base64", response_model=ImageRecognitionResponse)
async def recognize_cake_base64(data: ImageRecognitionRequest):
    """
    Nhận diện bánh từ ảnh base64 (cho web/mobile camera capture)
    
    - image_base64: Ảnh dạng base64 string (không có prefix data:image/...)
    - mime_type: image/jpeg, image/png, etc.
    """
    try:
        image_data = base64.b64decode(data.image_base64)
    except:
        raise HTTPException(status_code=400, detail="Base64 không hợp lệ")
    
    product_names = get_all_product_names()
    product_list = "\n".join([f"- {name}" for name in product_names])
    
    prompt = f"""Bạn là chuyên gia nhận diện bánh ngọt của Sweet Bakery.

Nhiệm vụ: Phân tích ảnh và xác định đây là loại bánh gì.

Danh sách sản phẩm của cửa hàng:
{product_list}

Quy tắc:
1. Nếu bánh trong ảnh KHỚP với sản phẩm trong danh sách, trả về TÊN CHÍNH XÁC của sản phẩm đó
2. Nếu KHÔNG KHỚP hoặc không phải bánh, trả về "NOT_FOUND"
3. Chỉ trả về 1 dòng duy nhất, không giải thích

Phân tích ảnh và trả lời:"""

    try:
        response = vision_model.generate_content([
            prompt,
            {"mime_type": data.mime_type, "data": image_data}
        ])
        
        result = response.text.strip()
        print(f"[Camera] Gemini result: {result}")
        
        if result == "NOT_FOUND" or not result:
            return ImageRecognitionResponse(
                found=False,
                message="Không tìm thấy sản phẩm tương ứng"
            )
        
        product = find_product_by_name(result)
        
        if product:
            return ImageRecognitionResponse(
                found=True,
                message=f"Đã nhận diện: {product['name']}",
                product=RecognizedProduct(**product),
                redirect_url=f"/products/{product['id']}"
            )
        else:
            return ImageRecognitionResponse(
                found=False,
                message=f"Không tìm thấy '{result}' trong cửa hàng"
            )
            
    except Exception as e:
        print(f"[Camera] Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi phân tích ảnh")
