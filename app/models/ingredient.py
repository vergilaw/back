from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class IngredientModel:
    """Ingredient model - Quản lý nguyên vật liệu"""

    @staticmethod
    def create_ingredient(db, data: dict) -> dict:
        """Tạo nguyên liệu mới"""
        doc = {
            "name": data["name"],
            "unit": data["unit"],  # kg, g, lít, ml, cái, gói...
            "price_per_unit": data["price_per_unit"],  # Giá nhập/đơn vị
            "quantity": data.get("quantity", 0),  # Số lượng tồn
            "min_quantity": data.get("min_quantity", 10),  # Ngưỡng cảnh báo
            "supplier": data.get("supplier", ""),
            "description": data.get("description", ""),
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.ingredients.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    @staticmethod
    def find_all(db, include_inactive: bool = False) -> List[dict]:
        query = {} if include_inactive else {"is_active": True}
        return list(db.ingredients.find(query).sort("name", 1))

    @staticmethod
    def find_by_id(db, ingredient_id: str) -> Optional[dict]:
        try:
            return db.ingredients.find_one({"_id": ObjectId(ingredient_id)})
        except:
            return None

    @staticmethod
    def update_ingredient(db, ingredient_id: str, data: dict) -> Optional[dict]:
        data["updated_at"] = datetime.utcnow()
        return db.ingredients.find_one_and_update(
            {"_id": ObjectId(ingredient_id)},
            {"$set": data},
            return_document=True
        )

    @staticmethod
    def delete_ingredient(db, ingredient_id: str) -> bool:
        """Soft delete"""
        result = db.ingredients.update_one(
            {"_id": ObjectId(ingredient_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    @staticmethod
    def add_stock(db, ingredient_id: str, quantity: float, note: str = "") -> Optional[dict]:
        """Nhập kho"""
        ingredient = db.ingredients.find_one({"_id": ObjectId(ingredient_id)})
        if not ingredient:
            return None
        
        new_quantity = ingredient["quantity"] + quantity
        
        # Lưu lịch sử
        db.stock_history.insert_one({
            "ingredient_id": ObjectId(ingredient_id),
            "type": "import",
            "quantity": quantity,
            "before": ingredient["quantity"],
            "after": new_quantity,
            "note": note,
            "created_at": datetime.utcnow()
        })
        
        return db.ingredients.find_one_and_update(
            {"_id": ObjectId(ingredient_id)},
            {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}},
            return_document=True
        )

    @staticmethod
    def reduce_stock(db, ingredient_id: str, quantity: float, note: str = "") -> Optional[dict]:
        """Xuất kho"""
        ingredient = db.ingredients.find_one({"_id": ObjectId(ingredient_id)})
        if not ingredient or ingredient["quantity"] < quantity:
            return None
        
        new_quantity = ingredient["quantity"] - quantity
        
        db.stock_history.insert_one({
            "ingredient_id": ObjectId(ingredient_id),
            "type": "export",
            "quantity": quantity,
            "before": ingredient["quantity"],
            "after": new_quantity,
            "note": note,
            "created_at": datetime.utcnow()
        })
        
        return db.ingredients.find_one_and_update(
            {"_id": ObjectId(ingredient_id)},
            {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}},
            return_document=True
        )

    @staticmethod
    def get_low_stock(db) -> List[dict]:
        """Lấy nguyên liệu sắp hết"""
        return list(db.ingredients.find({
            "is_active": True,
            "$expr": {"$lte": ["$quantity", "$min_quantity"]}
        }))

    @staticmethod
    def get_stock_history(db, ingredient_id: str, limit: int = 50) -> List[dict]:
        """Lấy lịch sử nhập/xuất kho"""
        return list(
            db.stock_history
            .find({"ingredient_id": ObjectId(ingredient_id)})
            .sort("created_at", -1)
            .limit(limit)
        )

    @staticmethod
    def ingredient_to_dict(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "name": doc["name"],
            "unit": doc["unit"],
            "price_per_unit": doc["price_per_unit"],
            "quantity": doc["quantity"],
            "min_quantity": doc["min_quantity"],
            "supplier": doc.get("supplier", ""),
            "description": doc.get("description", ""),
            "is_active": doc["is_active"],
            "is_low_stock": doc["quantity"] <= doc["min_quantity"],
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"]
        }
