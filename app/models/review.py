from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class ReviewModel:
    """Review model - Đánh giá sản phẩm"""

    @staticmethod
    def create_review(db, review_data: dict) -> dict:
        """Tạo review mới"""
        review_doc = {
            "user_id": ObjectId(review_data["user_id"]),
            "product_id": ObjectId(review_data["product_id"]),
            "order_id": ObjectId(review_data["order_id"]),
            "rating": review_data["rating"],  # 1-5
            "comment": review_data.get("comment", ""),
            "is_approved": False,  # Admin duyệt
            "is_hidden": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.reviews.insert_one(review_doc)
        review_doc["_id"] = result.inserted_id
        return review_doc

    @staticmethod
    def find_by_product(db, product_id: str, only_approved: bool = True) -> List[dict]:
        """Lấy reviews của sản phẩm"""
        query = {"product_id": ObjectId(product_id)}
        if only_approved:
            query["is_approved"] = True
            query["is_hidden"] = False
        return list(db.reviews.find(query).sort("created_at", -1))

    @staticmethod
    def find_by_user(db, user_id: str) -> List[dict]:
        """Lấy reviews của user"""
        return list(db.reviews.find({"user_id": ObjectId(user_id)}).sort("created_at", -1))

    @staticmethod
    def find_pending(db) -> List[dict]:
        """Lấy reviews chờ duyệt (Admin)"""
        return list(db.reviews.find({"is_approved": False, "is_hidden": False}).sort("created_at", -1))

    @staticmethod
    def approve_review(db, review_id: str) -> Optional[dict]:
        """Duyệt review"""
        return db.reviews.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$set": {"is_approved": True, "updated_at": datetime.utcnow()}},
            return_document=True
        )

    @staticmethod
    def hide_review(db, review_id: str) -> Optional[dict]:
        """Ẩn review"""
        return db.reviews.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$set": {"is_hidden": True, "updated_at": datetime.utcnow()}},
            return_document=True
        )

    @staticmethod
    def get_product_rating(db, product_id: str) -> dict:
        """Tính rating trung bình của sản phẩm"""
        pipeline = [
            {"$match": {"product_id": ObjectId(product_id), "is_approved": True, "is_hidden": False}},
            {"$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"},
                "total_reviews": {"$sum": 1}
            }}
        ]
        result = list(db.reviews.aggregate(pipeline))
        if result:
            return {
                "avg_rating": round(result[0]["avg_rating"], 1),
                "total_reviews": result[0]["total_reviews"]
            }
        return {"avg_rating": 0, "total_reviews": 0}

    @staticmethod
    def check_can_review(db, user_id: str, product_id: str) -> dict:
        """Kiểm tra user có thể review sản phẩm không (đã mua & chưa review)"""
        # Kiểm tra đã mua chưa
        order = db.orders.find_one({
            "user_id": ObjectId(user_id),
            "status": "delivered",
            "items.product_id": product_id
        })
        if not order:
            return {"can_review": False, "reason": "Bạn chưa mua sản phẩm này"}
        
        # Kiểm tra đã review chưa
        existing = db.reviews.find_one({
            "user_id": ObjectId(user_id),
            "product_id": ObjectId(product_id)
        })
        if existing:
            return {"can_review": False, "reason": "Bạn đã đánh giá sản phẩm này"}
        
        return {"can_review": True, "order_id": str(order["_id"])}

    @staticmethod
    def review_to_dict(review: dict, include_user: bool = False) -> dict:
        if not review:
            return None
        result = {
            "id": str(review["_id"]),
            "user_id": str(review["user_id"]),
            "product_id": str(review["product_id"]),
            "order_id": str(review["order_id"]),
            "rating": review["rating"],
            "comment": review.get("comment", ""),
            "is_approved": review["is_approved"],
            "created_at": review["created_at"]
        }
        return result
