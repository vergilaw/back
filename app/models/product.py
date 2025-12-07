from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class ProductModel:
    """Product model for MongoDB operations"""

    @staticmethod
    def create_product(db, product_data: dict) -> dict:
        """Create a new product"""
        product_doc = {
            **product_data,
            "ingredients": product_data.get("ingredients", []),
            "is_available": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = db.products.insert_one(product_doc)
        product_doc["_id"] = result.inserted_id
        return product_doc

    @staticmethod
    def find_all(
            db,
            skip: int = 0,
            limit: int = 20,
            category: Optional[str] = None,
            search: Optional[str] = None
    ) -> List[dict]:
        """Find all products with filters"""
        query = {"is_available": True}

        if category and category != 'all':
            query["category"] = category

        if search:
            query["name"] = {"$regex": search, "$options": "i"}

        products = list(
            db.products
            .find(query)
            .skip(skip)
            .limit(limit)
            .sort("created_at", -1)
        )
        return products

    @staticmethod
    def count_products(db, category: Optional[str] = None) -> int:
        """Count products by category"""
        query = {"is_available": True}
        if category and category != 'all':
            query["category"] = category
        return db.products.count_documents(query)

    @staticmethod
    def find_by_id(db, product_id: str) -> Optional[dict]:
        """Find product by ID"""
        try:
            return db.products.find_one({"_id": ObjectId(product_id)})
        except:
            return None

    @staticmethod
    def update_product(db, product_id: str, update_data: dict) -> Optional[dict]:
        """Update product"""
        try:
            update_data["updated_at"] = datetime.utcnow()
            result = db.products.find_one_and_update(
                {"_id": ObjectId(product_id)},
                {"$set": update_data},
                return_document=True
            )
            return result
        except:
            return None

    @staticmethod
    def delete_product(db, product_id: str) -> bool:
        """Soft delete product"""
        try:
            result = db.products.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": {"is_available": False, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except:
            return False

    @staticmethod
    def product_to_dict(product: dict, db=None) -> dict:
        """Convert product document to dict with ingredient details"""
        if not product:
            return None

        # ← SỬA: if db and product.get → if db is not None and product.get
        ingredient_details = []
        if db is not None and product.get("ingredients"):
            for ing_usage in product["ingredients"]:
                ingredient = db.ingredients.find_one({
                    "_id": ObjectId(ing_usage["ingredient_id"])
                })

                if ingredient:
                    quantity_needed = ing_usage["quantity"]
                    available_stock = ingredient["quantity"]

                    ingredient_details.append({
                        "ingredient_id": str(ingredient["_id"]),
                        "name": ingredient["name"],
                        "unit": ingredient["unit"],
                        "quantity_needed": quantity_needed,
                        "available_stock": available_stock,
                        "is_sufficient": available_stock >= quantity_needed
                    })

        return {
            "id": str(product["_id"]),
            "name": product["name"],
            "category": product["category"],
            "price": product["price"],
            "description": product["description"],
            "image": product.get("image", ""),
            "badge": product.get("badge"),
            "ingredients": ingredient_details,
            "is_available": product.get("is_available", True),
            "created_at": product["created_at"],
            "updated_at": product["updated_at"]
        }

    @staticmethod
    def check_ingredients_availability(db, product_id: str, quantity: int = 1) -> dict:
        """
        Kiểm tra xem có đủ nguyên liệu để làm sản phẩm không
        Trả về: {available: bool, missing: [...]}
        """
        product = db.products.find_one({"_id": ObjectId(product_id)})

        if not product or not product.get("ingredients"):
            return {"available": True, "missing": []}

        missing_ingredients = []

        for ing_usage in product["ingredients"]:
            ingredient = db.ingredients.find_one({
                "_id": ObjectId(ing_usage["ingredient_id"])
            })

            if not ingredient:
                continue

            needed = ing_usage["quantity"] * quantity
            available = ingredient["quantity"]

            if available < needed:
                missing_ingredients.append({
                    "name": ingredient["name"],
                    "needed": needed,
                    "available": available,
                    "shortage": needed - available,
                    "unit": ingredient["unit"]
                })

        return {
            "available": len(missing_ingredients) == 0,
            "missing": missing_ingredients
        }


class CategoryModel:
    """Category model - Returns dynamic categories from database"""

    @staticmethod
    def get_all_categories(db) -> List[dict]:
        """
        Get all unique categories from products collection
        This dynamically generates categories based on actual products in DB
        """
        pipeline = [
            {"$match": {"is_available": True}},
            {"$group": {
                "_id": "$category",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]

        results = list(db.products.aggregate(pipeline))

        category_info = {
            "birthday-cakes": {
                "name": "Birthday Cakes",
                "description": "Special cakes for birthday celebrations",
                "image_url": "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&q=80"
            },
            "bread-savory": {
                "name": "Bread & Savory",
                "description": "Fresh bread and savory pastries",
                "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80"
            },
            "cookies-minicakes": {
                "name": "Cookies & Minicakes",
                "description": "Delicious cookies and mini desserts",
                "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80"
            },
            "beverages": {
                "name": "Beverages",
                "description": "Coffee, tea, and fresh juices",
                "image_url": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80"
            }
        }

        categories = []

        total_count = db.products.count_documents({"is_available": True})
        categories.append({
            "id": "all",
            "name": "All Products",
            "slug": "all",
            "description": "All bakery products",
            "image_url": None,
            "product_count": total_count
        })

        for result in results:
            category_id = result["_id"]
            info = category_info.get(category_id, {
                "name": category_id.replace("-", " ").title(),
                "description": f"{category_id} products",
                "image_url": None
            })

            categories.append({
                "id": category_id,
                "name": info["name"],
                "slug": category_id,
                "description": info["description"],
                "image_url": info.get("image_url"),
                "product_count": result["count"]
            })

        return categories