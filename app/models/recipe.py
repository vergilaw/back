from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class RecipeModel:
    """Recipe model - Công thức làm bánh"""

    @staticmethod
    def create_recipe(db, data: dict) -> dict:
        """Tạo công thức mới"""
        doc = {
            "product_id": ObjectId(data["product_id"]),
            "ingredients": data["ingredients"],  # [{ingredient_id, quantity, unit}]
            "instructions": data.get("instructions", ""),  # Hướng dẫn làm
            "origin": data.get("origin", ""),  # Nguồn gốc nguyên liệu
            "story": data.get("story", ""),  # User story / lịch sử bánh
            "history": data.get("history", ""),  # Lịch sử nguồn gốc
            "prep_time": data.get("prep_time", 0),  # Thời gian chuẩn bị (phút)
            "cook_time": data.get("cook_time", 0),  # Thời gian làm (phút)
            "servings": data.get("servings", 1),  # Số phần
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.recipes.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    @staticmethod
    def find_by_product(db, product_id: str) -> Optional[dict]:
        """Lấy công thức của sản phẩm"""
        try:
            return db.recipes.find_one({"product_id": ObjectId(product_id)})
        except:
            return None

    @staticmethod
    def find_by_id(db, recipe_id: str) -> Optional[dict]:
        try:
            return db.recipes.find_one({"_id": ObjectId(recipe_id)})
        except:
            return None

    @staticmethod
    def update_recipe(db, recipe_id: str, data: dict) -> Optional[dict]:
        data["updated_at"] = datetime.utcnow()
        if "product_id" in data:
            data["product_id"] = ObjectId(data["product_id"])
        return db.recipes.find_one_and_update(
            {"_id": ObjectId(recipe_id)},
            {"$set": data},
            return_document=True
        )

    @staticmethod
    def delete_recipe(db, recipe_id: str) -> bool:
        result = db.recipes.delete_one({"_id": ObjectId(recipe_id)})
        return result.deleted_count > 0

    @staticmethod
    def calculate_cost(db, recipe_id: str) -> dict:
        """Tính giá vốn của công thức"""
        recipe = db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not recipe:
            return {"cost": 0, "details": []}
        
        total_cost = 0
        details = []
        
        for item in recipe.get("ingredients", []):
            ingredient = db.ingredients.find_one({"_id": ObjectId(item["ingredient_id"])})
            if ingredient:
                item_cost = ingredient["price_per_unit"] * item["quantity"]
                total_cost += item_cost
                details.append({
                    "ingredient_id": str(ingredient["_id"]),
                    "name": ingredient["name"],
                    "quantity": item["quantity"],
                    "unit": item["unit"],
                    "price_per_unit": ingredient["price_per_unit"],
                    "cost": item_cost
                })
        
        return {"total_cost": total_cost, "details": details}

    @staticmethod
    def deduct_ingredients(db, product_id: str, quantity: int = 1) -> dict:
        """Trừ nguyên liệu khi bán sản phẩm"""
        recipe = db.recipes.find_one({"product_id": ObjectId(product_id)})
        if not recipe:
            return {"success": False, "message": "Không tìm thấy công thức"}
        
        # Kiểm tra đủ nguyên liệu không
        for item in recipe.get("ingredients", []):
            ingredient = db.ingredients.find_one({"_id": ObjectId(item["ingredient_id"])})
            if not ingredient:
                return {"success": False, "message": f"Nguyên liệu không tồn tại"}
            needed = item["quantity"] * quantity
            if ingredient["quantity"] < needed:
                return {
                    "success": False, 
                    "message": f"Không đủ {ingredient['name']} (cần {needed}, còn {ingredient['quantity']})"
                }
        
        # Trừ nguyên liệu
        from app.models.ingredient import IngredientModel
        for item in recipe.get("ingredients", []):
            needed = item["quantity"] * quantity
            IngredientModel.reduce_stock(
                db, 
                item["ingredient_id"], 
                needed, 
                f"Bán sản phẩm (x{quantity})"
            )
        
        return {"success": True, "message": "Đã trừ nguyên liệu"}

    @staticmethod
    def recipe_to_dict(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "product_id": str(doc["product_id"]),
            "ingredients": doc.get("ingredients", []),
            "instructions": doc.get("instructions", ""),
            "origin": doc.get("origin", ""),
            "story": doc.get("story", ""),
            "history": doc.get("history", ""),
            "prep_time": doc.get("prep_time", 0),
            "cook_time": doc.get("cook_time", 0),
            "servings": doc.get("servings", 1),
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"]
        }
