"""
Hybrid Chatbot - Rule-based + RAG với Gemini
"""
import re
import google.generativeai as genai
from typing import Optional
from app.config import settings
from app.database import get_database

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


class ChatbotService:
    """Hybrid chatbot: Rule-based + RAG với Gemini"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Rule-based intents
        self.intents = {
            "greeting": {
                "keywords": ["xin chào", "hello", "hi", "chào", "hey"],
                "response": "Xin chào! Sweet Bakery xin phục vụ quý khách. Tôi có thể giúp gì cho bạn?"
            },
            "thanks": {
                "keywords": ["cảm ơn", "thank", "thanks", "tks"],
                "response": "Không có gì ạ! Cảm ơn bạn đã ghé Sweet Bakery. Chúc bạn ngon miệng!"
            },
            "goodbye": {
                "keywords": ["tạm biệt", "bye", "goodbye", "bái"],
                "response": "Tạm biệt bạn! Hẹn gặp lại tại Sweet Bakery nhé!"
            },
            "contact": {
                "keywords": ["liên hệ", "địa chỉ", "số điện thoại", "hotline", "ở đâu"],
                "response": "Dia chi: 123 Nguyen Hue, Quan 1, TP.HCM\nHotline: 0901 234 567\nGio mo cua: 7:00 - 22:00 hang ngay"
            },
            "hours": {
                "keywords": ["mấy giờ", "giờ mở cửa", "mở cửa", "đóng cửa"],
                "response": "Sweet Bakery mở cửa từ 7:00 sáng đến 22:00 tối, tất cả các ngày trong tuần!"
            },
            "delivery": {
                "keywords": ["giao hàng", "ship", "vận chuyển", "freeship"],
                "response": "Chúng tôi giao hàng trong nội thành TP.HCM:\n- Đơn từ 200k: Freeship\n- Đơn dưới 200k: Phí ship 25k\n- Thời gian giao: 30-60 phút"
            },
            "payment": {
                "keywords": ["thanh toán", "trả tiền", "chuyển khoản", "cod"],
                "response": "Phương thức thanh toán:\n- COD (thanh toán khi nhận hàng)\n- Chuyển khoản qua PayOS (QR code)\n- Momo, ZaloPay"
            },
            "promotion": {
                "keywords": ["khuyến mãi", "giảm giá", "voucher", "sale", "ưu đãi"],
                "response": "Ưu đãi hiện tại:\n- Giảm 10% cho đơn đầu tiên\n- Freeship đơn từ 200k\n- Tích điểm đổi quà"
            }
        }
        
        # Store info
        self.store_info = """
        Sweet Bakery - Tiệm bánh ngọt cao cấp
        Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM
        Hotline: 0901 234 567
        Giờ mở cửa: 7:00 - 22:00 hàng ngày
        
        Chính sách:
        - Freeship đơn từ 200k nội thành
        - Đổi trả trong 24h nếu bánh lỗi
        - Thanh toán: COD, PayOS, Momo, ZaloPay
        """

    def detect_intent(self, message: str) -> Optional[str]:
        """Detect intent từ message"""
        message_lower = message.lower()
        
        # Nếu có từ khóa về sản phẩm/giá → đi RAG, không dùng rule
        product_keywords = ["giá", "bao nhiêu", "tiền", "bánh", "mua", "đặt", "cái", "món", "loại"]
        if any(kw in message_lower for kw in product_keywords):
            return None  # Đi RAG
        
        for intent, data in self.intents.items():
            if any(kw in message_lower for kw in data["keywords"]):
                return intent
        return None

    def get_rule_response(self, intent: str) -> str:
        """Lấy response từ rule"""
        return self.intents.get(intent, {}).get("response", "")

    def search_products(self, query: str, limit: int = 5) -> list:
        """Tìm sản phẩm liên quan"""
        db = get_database()
        
        # Text search
        products = list(db.products.find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}}
            ],
            "is_available": True
        }).limit(limit))
        
        return [{
            "id": str(p["_id"]),
            "name": p["name"],
            "price": p["price"],
            "category": p["category"],
            "description": p.get("description", "")[:100]
        } for p in products]

    def detect_products_in_message(self, message: str) -> list:
        """Phát hiện sản phẩm được nhắc đến trong tin nhắn"""
        db = get_database()
        message_lower = message.lower()
        
        # Lấy tất cả sản phẩm
        all_products = list(db.products.find({"is_available": True}))
        
        detected = []
        for p in all_products:
            product_name = p["name"].lower()
            # Kiểm tra tên sản phẩm có trong tin nhắn không
            # Tách từng từ trong tên sản phẩm để match linh hoạt hơn
            name_words = product_name.split()
            
            # Match nếu tên đầy đủ hoặc >= 2 từ khớp
            if product_name in message_lower:
                detected.append({
                    "id": str(p["_id"]),
                    "name": p["name"],
                    "price": p["price"],
                    "category": p["category"],
                    "image": p.get("image", ""),
                    "match_score": 100
                })
            elif len(name_words) >= 2:
                matched_words = sum(1 for w in name_words if w in message_lower and len(w) > 2)
                if matched_words >= 2:
                    detected.append({
                        "id": str(p["_id"]),
                        "name": p["name"],
                        "price": p["price"],
                        "category": p["category"],
                        "image": p.get("image", ""),
                        "match_score": matched_words * 30
                    })
        
        # Sắp xếp theo match_score
        detected.sort(key=lambda x: x["match_score"], reverse=True)
        return detected[:3]  # Trả về tối đa 3 sản phẩm

    def get_bestsellers(self, limit: int = 3) -> list:
        """Lấy sản phẩm bán chạy"""
        db = get_database()
        
        pipeline = [
            {"$match": {"payment_status": "paid"}},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "name": {"$first": "$items.name"},
                "total_sold": {"$sum": "$items.quantity"}
            }},
            {"$sort": {"total_sold": -1}},
            {"$limit": limit}
        ]
        
        return list(db.orders.aggregate(pipeline))

    def get_user_orders(self, user_id: str, limit: int = 3) -> list:
        """Lấy đơn hàng của user"""
        db = get_database()
        from bson import ObjectId
        
        orders = list(
            db.orders
            .find({"user_id": ObjectId(user_id)})
            .sort("created_at", -1)
            .limit(limit)
        )
        
        return [{
            "id": str(o["_id"]),
            "total": o["total_amount"],
            "status": o["status"],
            "items": [i["name"] for i in o["items"]]
        } for o in orders]

    def build_context(self, message: str, user_id: Optional[str] = None) -> str:
        """Build context cho RAG"""
        context_parts = []
        
        # Thông tin cửa hàng
        context_parts.append(f"Thông tin cửa hàng:\n{self.store_info}")
        
        # Tìm sản phẩm liên quan
        products = self.search_products(message)
        if products:
            products_text = "\n".join([
                f"- {p['name']}: {p['price']:,.0f}đ ({p['category']})"
                for p in products
            ])
            context_parts.append(f"Sản phẩm liên quan:\n{products_text}")
        
        # Bestsellers
        if any(kw in message.lower() for kw in ["ngon", "bán chạy", "nên mua", "gợi ý", "recommend"]):
            bestsellers = self.get_bestsellers()
            if bestsellers:
                bs_text = "\n".join([f"- {b['name']} (đã bán {b['total_sold']})" for b in bestsellers])
                context_parts.append(f"Sản phẩm bán chạy:\n{bs_text}")
        
        # Đơn hàng của user
        if user_id and any(kw in message.lower() for kw in ["đơn hàng", "order", "đặt", "tracking"]):
            orders = self.get_user_orders(user_id)
            if orders:
                orders_text = "\n".join([
                    f"- Đơn {o['id'][-6:]}: {o['status']} - {o['total']:,.0f}đ"
                    for o in orders
                ])
                context_parts.append(f"Đơn hàng của bạn:\n{orders_text}")
        
        return "\n\n".join(context_parts)

    def get_conversation_history(self, user_id: str, limit: int = 5) -> str:
        """Lấy lịch sử hội thoại gần đây"""
        db = get_database()
        from bson import ObjectId
        
        conversation = db.conversations.find_one({"user_id": ObjectId(user_id)})
        if not conversation:
            return ""
        
        messages = conversation.get("messages", [])[-limit*2:]  # Lấy cặp user-assistant
        
        if not messages:
            return ""
        
        history = []
        for m in messages:
            role = "Khách" if m["role"] == "user" else "Bot"
            history.append(f"{role}: {m['content']}")
        
        return "\n".join(history)

    async def get_rag_response(self, message: str, user_id: Optional[str] = None) -> str:
        """Gọi Gemini với RAG context + lịch sử hội thoại"""
        context = self.build_context(message, user_id)
        
        # Thêm lịch sử hội thoại nếu có user_id
        history = ""
        if user_id:
            history = self.get_conversation_history(user_id)
            if history:
                history = f"\nLịch sử hội thoại gần đây:\n{history}\n"
        
        prompt = f"""Bạn là chatbot của Sweet Bakery - tiệm bánh ngọt cao cấp.

Quy tắc:
- Tra loi ngan gon, than thien, KHONG dung emoji
- Chỉ trả lời dựa trên context được cung cấp
- Nếu không biết, hướng dẫn liên hệ hotline
- Giá tiền format: xxx,xxxđ
- Không bịa thông tin
- Nếu có lịch sử hội thoại, hãy nhớ ngữ cảnh để trả lời liên tục
{history}
Context:
{context}

Câu hỏi của khách: {message}

Trả lời:"""

        try:
            print(f"[Chatbot] Calling Gemini with context length: {len(context)}")
            response = self.model.generate_content(prompt)
            print(f"[Chatbot] Gemini response received")
            return response.text
        except Exception as e:
            print(f"[Chatbot] Gemini error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng liên hệ hotline 0901 234 567 để được hỗ trợ!"

    async def chat(self, message: str, user_id: Optional[str] = None) -> dict:
        """Main chat function - Hybrid approach"""
        
        # 0. Phát hiện sản phẩm trong tin nhắn
        detected_products = self.detect_products_in_message(message)
        
        # 1. Check rule-based first
        intent = self.detect_intent(message)
        if intent:
            return {
                "response": self.get_rule_response(intent),
                "intent": intent,
                "source": "rule",
                "products": detected_products
            }
        
        # 2. Fallback to RAG
        response = await self.get_rag_response(message, user_id)
        return {
            "response": response,
            "intent": "rag",
            "source": "gemini",
            "products": detected_products
        }


# Singleton instance
chatbot_service = ChatbotService()
