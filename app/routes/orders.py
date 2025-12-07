from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.models.order import OrderModel
from app.utils.dependencies import get_current_active_user, get_current_active_admin
from app.database import get_database

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create a new order (User)
    
    - **items**: List of products [{product_id, name, price, quantity, image}]
    - **shipping_address**: Delivery address
    - **phone**: Contact phone
    - **payment_method**: "cod" or "vnpay"
    """
    db = get_database()
    
    # Calculate total
    total_amount = sum(item.price * item.quantity for item in order_data.items)
    
    if total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order total must be greater than 0"
        )
    
    # Validate payment method
    if order_data.payment_method not in ["cod", "payos"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment method. Use 'cod' or 'payos'"
        )
    
    order = OrderModel.create_order(db, {
        "user_id": str(current_user["_id"]),
        "items": [item.dict() for item in order_data.items],
        "total_amount": total_amount,
        "shipping_address": order_data.shipping_address,
        "phone": order_data.phone,
        "note": order_data.note,
        "payment_method": order_data.payment_method
    })
    
    return OrderModel.order_to_dict(order)


@router.get("/me", response_model=List[OrderResponse])
async def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_active_user)
):
    """Get current user's orders"""
    db = get_database()
    orders = OrderModel.find_by_user(db, str(current_user["_id"]), skip, limit)
    return [OrderModel.order_to_dict(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get order by ID (User can only view their own orders)"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check ownership (unless admin)
    if current_user["role"] != "admin" and str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order"
        )
    
    return OrderModel.order_to_dict(order)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Cancel an order (only if not shipped yet)"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check ownership
    if current_user["role"] != "admin" and str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this order"
        )
    
    cancelled = OrderModel.cancel_order(db, order_id)
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order (already shipped or delivered)"
        )
    
    return OrderModel.order_to_dict(cancelled)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete a cancelled order (User can only delete their own cancelled orders)"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check ownership (admin can delete any)
    if current_user["role"] != "admin" and str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this order"
        )
    
    # Only allow deleting cancelled orders (for users)
    if current_user["role"] != "admin" and order.get("status") != "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only cancelled orders can be deleted"
        )
    
    from bson import ObjectId
    result = db.orders.delete_one({"_id": ObjectId(order_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )
    
    return None


# ============ ADMIN ENDPOINTS ============

@router.get("", response_model=List[OrderResponse])
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    admin_user: dict = Depends(get_current_active_admin)
):
    """Get all orders (Admin only)"""
    db = get_database()
    orders = OrderModel.find_all(db, skip, limit, status)
    return [OrderModel.order_to_dict(o) for o in orders]


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    admin_user: dict = Depends(get_current_active_admin)
):
    """Update order status (Admin only)"""
    db = get_database()
    
    valid_statuses = ["pending", "paid", "confirmed", "shipping", "delivered", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    updated = OrderModel.update_status(db, order_id, status_update.status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return OrderModel.order_to_dict(updated)


@router.get("/stats/count")
async def get_order_stats(
    admin_user: dict = Depends(get_current_active_admin)
):
    """Get order statistics (Admin only)"""
    db = get_database()
    return {
        "total": OrderModel.count_orders(db),
        "pending": OrderModel.count_orders(db, "pending"),
        "paid": OrderModel.count_orders(db, "paid"),
        "confirmed": OrderModel.count_orders(db, "confirmed"),
        "shipping": OrderModel.count_orders(db, "shipping"),
        "delivered": OrderModel.count_orders(db, "delivered"),
        "cancelled": OrderModel.count_orders(db, "cancelled")
    }
