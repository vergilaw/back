from datetime import datetime
from typing import Optional
from bson import ObjectId


class UserModel:
    @staticmethod
    def create_user(db, user_data: dict, role: str = "user") -> dict:
        user_doc = {
            "email": user_data["email"],
            "password": user_data["password"],
            "full_name": user_data["full_name"],
            "phone": user_data["phone"],
            "role": role,  # "admin" or "user"
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    @staticmethod
    def find_by_email(db, email: str) -> Optional[dict]:
        return db.users.find_one({"email": email})

    @staticmethod
    def find_by_id(db, user_id: str) -> Optional[dict]:
        try:
            return db.users.find_one({"_id": ObjectId(user_id)})
        except:
            return None

    @staticmethod
    def update_user(db, user_id: str, update_data: dict) -> Optional[dict]:
        try:
            update_data["updated_at"] = datetime.utcnow()
            result = db.users.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": update_data},
                return_document=True
            )
            return result
        except:
            return None

    @staticmethod
    def update_password(db, user_id: str, new_password: str) -> bool:
        try:
            result = db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "password": new_password,
                    "updated_at": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except:
            return False

    @staticmethod
    def delete_user(db, user_id: str) -> bool:
        """Delete user (soft delete - set is_active to False)"""
        try:
            result = db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except:
            return False

    @staticmethod
    def get_all_users(db, skip: int = 0, limit: int = 20) -> list:
        """Get all users (admin only)"""
        users = list(
            db.users
            .find()
            .skip(skip)
            .limit(limit)
            .sort("created_at", -1)
        )
        return users

    @staticmethod
    def user_to_dict(user: dict) -> dict:
        if not user:
            return None

        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user["phone"],
            "role": user["role"],
            "is_active": user["is_active"],
            "created_at": user["created_at"]
        }