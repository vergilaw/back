from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class OrderModel:
    """Order model for MongoDB operations"""

    # Order statuses
    STATUS_PENDING = "pending"           # Chờ thanh toán
    STATUS_PAID = "paid"                 # Đã thanh toán
    STATUS_CONFIRMED = "confirmed"       # Đã xác nhận
    STATUS_SHIPPING = "shipping"         # Đang giao
    STATUS_DELIVERED = "delivered"       # Đã giao
    STATUS_CANCELLED = "cancelled"       # Đã hủy

    # Payment methods
    PAYMENT_COD = "cod"                  # Thanh toán khi nhận hàng
    PAYMENT_VNPAY = "vnpay"              # VNPay

    @staticmethod
    def create_order(db, order_data: dict) -> dict:
        """Create a new order"""
        order_doc = {
            "user_id": ObjectId(order_data["user_id"]),
            "items": order_data["items"],  # [{product_id, name, price, quantity, image}]
            "total_amount": order_data["total_amount"],
            "shipping_address": order_data["shipping_address"],
            "phone": order_data["phone"],
            "note": order_data.get("note", ""),
            "payment_method": order_data.get("payment_method", "cod"),
            "payment_status": "unpaid",  # unpaid, paid, refunded
            "status": OrderModel.STATUS_PENDING,
            "vnpay_transaction_id": None,
            "paid_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.orders.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id
        return order_doc

    @staticmethod
    def find_by_id(db, order_id: str) -> Optional[dict]:
        try:
            return db.orders.find_one({"_id": ObjectId(order_id)})
        except:
            return None

    @staticmethod
    def find_by_user(db, user_id: str, skip: int = 0, limit: int = 20) -> List[dict]:
        return list(
            db.orders
            .find({"user_id": ObjectId(user_id)})
            .skip(skip)
            .limit(limit)
            .sort("created_at", -1)
        )

    @staticmethod
    def find_all(db, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> List[dict]:
        query = {}
        if status:
            query["status"] = status
        return list(
            db.orders
            .find(query)
            .skip(skip)
            .limit(limit)
            .sort("created_at", -1)
        )

    @staticmethod
    def update_status(db, order_id: str, status: str) -> Optional[dict]:
        try:
            return db.orders.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": {"status": status, "updated_at": datetime.utcnow()}},
                return_document=True
            )
        except:
            return None

    @staticmethod
    def update_payment(db, order_id: str, transaction_id: str) -> Optional[dict]:
        """Update payment status after successful payment"""
        try:
            return db.orders.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": {
                    "payment_status": "paid",
                    "status": OrderModel.STATUS_PAID,
                    "vnpay_transaction_id": transaction_id,
                    "paid_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }},
                return_document=True
            )
        except:
            return None

    @staticmethod
    def cancel_order(db, order_id: str) -> Optional[dict]:
        try:
            order = db.orders.find_one({"_id": ObjectId(order_id)})
            if not order:
                return None
            # Chỉ hủy được khi chưa giao
            if order["status"] in [OrderModel.STATUS_SHIPPING, OrderModel.STATUS_DELIVERED]:
                return None
            return db.orders.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": {"status": OrderModel.STATUS_CANCELLED, "updated_at": datetime.utcnow()}},
                return_document=True
            )
        except:
            return None

    @staticmethod
    def count_orders(db, status: Optional[str] = None) -> int:
        query = {}
        if status:
            query["status"] = status
        return db.orders.count_documents(query)

    @staticmethod
    def order_to_dict(order: dict) -> dict:
        if not order:
            return None
        return {
            "id": str(order["_id"]),
            "user_id": str(order["user_id"]),
            "items": order["items"],
            "total_amount": order["total_amount"],
            "shipping_address": order["shipping_address"],
            "phone": order["phone"],
            "note": order.get("note", ""),
            "payment_method": order["payment_method"],
            "payment_status": order["payment_status"],
            "status": order["status"],
            "vnpay_transaction_id": order.get("vnpay_transaction_id"),
            "paid_at": order.get("paid_at"),
            "created_at": order["created_at"],
            "updated_at": order["updated_at"]
        }
