from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from bson import ObjectId

from app.models.user import UserModel
from app.utils.dependencies import get_current_active_admin
from app.database import get_database

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============ USER MANAGEMENT ============

@router.get("/users")
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = None,
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy danh sách users (Admin)"""
    db = get_database()
    query = {}
    if role:
        query["role"] = role
    
    users = list(
        db.users
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort("created_at", -1)
    )
    
    return [{
        "id": str(u["_id"]),
        "email": u["email"],
        "full_name": u["full_name"],
        "phone": u["phone"],
        "role": u["role"],
        "is_active": u["is_active"],
        "created_at": u["created_at"]
    } for u in users]


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Xem chi tiết user (Admin)"""
    db = get_database()
    user = UserModel.find_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lấy thống kê
    orders = list(db.orders.find({"user_id": ObjectId(user_id)}))
    total_spent = sum(o["total_amount"] for o in orders if o["payment_status"] == "paid")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "phone": user["phone"],
        "role": user["role"],
        "is_active": user["is_active"],
        "created_at": user["created_at"],
        "stats": {
            "total_orders": len(orders),
            "total_spent": total_spent
        }
    }


@router.post("/users/{user_id}/block")
async def block_user(
    user_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Khóa user (Admin)"""
    db = get_database()
    
    # Không cho khóa chính mình
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    user = UserModel.find_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}}
    )
    return {"message": "User blocked", "user_id": user_id}


@router.post("/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Mở khóa user (Admin)"""
    db = get_database()
    user = UserModel.find_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True}}
    )
    return {"message": "User unblocked", "user_id": user_id}


@router.post("/users/{user_id}/set-role")
async def set_user_role(
    user_id: str,
    role: str = Query(..., regex="^(admin|user)$"),
    admin: dict = Depends(get_current_active_admin)
):
    """Đổi role user (Admin)"""
    db = get_database()
    
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    user = UserModel.find_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )
    return {"message": f"User role changed to {role}", "user_id": user_id}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Xóa user (Admin) - Soft delete"""
    db = get_database()
    
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    if not UserModel.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return None


# ============ DASHBOARD ============

@router.get("/dashboard")
async def get_dashboard(
    admin: dict = Depends(get_current_active_admin)
):
    """Dashboard tổng quan (Admin)"""
    db = get_database()
    
    # Users
    total_users = db.users.count_documents({"role": "user"})
    active_users = db.users.count_documents({"role": "user", "is_active": True})
    
    # Orders
    total_orders = db.orders.count_documents({})
    pending_orders = db.orders.count_documents({"status": "pending"})
    
    # Revenue (paid orders)
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = list(db.orders.aggregate(pipeline))
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Products
    total_products = db.products.count_documents({"is_available": True})
    
    # Ingredients
    total_ingredients = db.ingredients.count_documents({"is_active": True})
    low_stock = db.ingredients.count_documents({
        "is_active": True,
        "$expr": {"$lte": ["$quantity", "$min_quantity"]}
    })
    
    # Reviews pending
    pending_reviews = db.reviews.count_documents({"is_approved": False, "is_hidden": False})
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "orders": {
            "total": total_orders,
            "pending": pending_orders
        },
        "revenue": {
            "total": total_revenue
        },
        "products": {
            "total": total_products
        },
        "ingredients": {
            "total": total_ingredients,
            "low_stock": low_stock
        },
        "reviews": {
            "pending": pending_reviews
        }
    }


@router.get("/dashboard/recent-orders")
async def get_recent_orders(
    limit: int = Query(10, ge=1, le=50),
    admin: dict = Depends(get_current_active_admin)
):
    """Đơn hàng gần đây (Admin)"""
    db = get_database()
    
    orders = list(
        db.orders
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )
    
    result = []
    for o in orders:
        user = db.users.find_one({"_id": o["user_id"]})
        result.append({
            "id": str(o["_id"]),
            "customer": user["full_name"] if user else "N/A",
            "total": o["total_amount"],
            "status": o["status"],
            "payment_status": o["payment_status"],
            "created_at": o["created_at"]
        })
    
    return result
