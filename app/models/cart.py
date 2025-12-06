from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class CartModel:
    """Cart model for MongoDB operations"""

    @staticmethod
    def add_to_cart(db, user_id: str, product_id: str, quantity: int = 1) -> dict:
        """Add product to cart or update quantity if exists"""
        cart_item = db.cart.find_one({
            "user_id": ObjectId(user_id),
            "product_id": ObjectId(product_id)
        })

        if cart_item:
            # Update quantity
            new_quantity = cart_item["quantity"] + quantity
            result = db.cart.update_one(
                {"_id": cart_item["_id"]},
                {
                    "$set": {
                        "quantity": new_quantity,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            cart_item["quantity"] = new_quantity
            return cart_item
        else:
            # Create new cart item
            cart_doc = {
                "user_id": ObjectId(user_id),
                "product_id": ObjectId(product_id),
                "quantity": quantity,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = db.cart.insert_one(cart_doc)
            cart_doc["_id"] = result.inserted_id
            return cart_doc

    @staticmethod
    def get_user_cart(db, user_id: str) -> List[dict]:
        """Get cart with product details"""
        try:
            pipeline = [
                {"$match": {"user_id": ObjectId(user_id)}},
                {
                    "$lookup": {
                        "from": "products",
                        "localField": "product_id",
                        "foreignField": "_id",
                        "as": "product"
                    }
                },
                {"$unwind": "$product"},
                {"$match": {"product.is_available": True}},
                {"$sort": {"created_at": -1}},
                {
                    "$project": {
                        "_id": 0,
                        "cart_id": {"$toString": "$_id"},
                        "quantity": 1,
                        "added_at": "$created_at",
                        "product": {
                            "id": {"$toString": "$product._id"},
                            "name": "$product.name",
                            "category": "$product.category",
                            "price": "$product.price",
                            "description": "$product.description",
                            "image": "$product.image",
                            "badge": "$product.badge",
                            "is_available": "$product.is_available"
                        }
                    }
                }
            ]
            return list(db.cart.aggregate(pipeline))
        except Exception as e:
            print(f"Error getting cart: {e}")
            return []

    @staticmethod
    def update_quantity(db, user_id: str, product_id: str, quantity: int) -> bool:
        """Update cart item quantity"""
        try:
            if quantity <= 0:
                return CartModel.remove_from_cart(db, user_id, product_id)

            result = db.cart.update_one(
                {
                    "user_id": ObjectId(user_id),
                    "product_id": ObjectId(product_id)
                },
                {
                    "$set": {
                        "quantity": quantity,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except:
            return False

    @staticmethod
    def remove_from_cart(db, user_id: str, product_id: str) -> bool:
        """Remove item from cart"""
        try:
            result = db.cart.delete_one({
                "user_id": ObjectId(user_id),
                "product_id": ObjectId(product_id)
            })
            return result.deleted_count > 0
        except:
            return False

    @staticmethod
    def clear_cart(db, user_id: str) -> bool:
        """Clear all items from cart"""
        try:
            result = db.cart.delete_many({"user_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False

    @staticmethod
    def count_cart_items(db, user_id: str) -> int:
        """Count items in cart"""
        try:
            return db.cart.count_documents({"user_id": ObjectId(user_id)})
        except:
            return 0

    @staticmethod
    def get_cart_total(db, user_id: str) -> dict:
        """Calculate cart total"""
        try:
            pipeline = [
                {"$match": {"user_id": ObjectId(user_id)}},
                {
                    "$lookup": {
                        "from": "products",
                        "localField": "product_id",
                        "foreignField": "_id",
                        "as": "product"
                    }
                },
                {"$unwind": "$product"},
                {"$match": {"product.is_available": True}},
                {
                    "$group": {
                        "_id": None,
                        "subtotal": {
                            "$sum": {"$multiply": ["$quantity", "$product.price"]}
                        },
                        "total_items": {"$sum": "$quantity"}
                    }
                }
            ]

            result = list(db.cart.aggregate(pipeline))

            if result:
                subtotal = result[0]["subtotal"]
                total_items = result[0]["total_items"]
                shipping = 0 if subtotal >= 50 else 5.99

                return {
                    "subtotal": round(subtotal, 2),
                    "shipping": shipping,
                    "total": round(subtotal + shipping, 2),
                    "total_items": total_items
                }

            return {"subtotal": 0, "shipping": 0, "total": 0, "total_items": 0}
        except Exception as e:
            print(f"Error calculating cart total: {e}")
            return {"subtotal": 0, "shipping": 0, "total": 0, "total_items": 0}
