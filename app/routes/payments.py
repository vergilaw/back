from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
import time

from app.models.order import OrderModel
from app.utils.payos import payos_service
from app.utils.dependencies import get_current_active_user
from app.database import get_database

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/payos/{order_id}")
async def create_payos_payment(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Tạo PayOS payment link cho order
    
    Returns:
    - payment_url: URL checkout PayOS
    - qr_code: QR code string (dùng để generate QR image)
    """
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check ownership
    if str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Check if already paid
    if order["payment_status"] == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )
    
    # Generate unique order code (PayOS yêu cầu integer, unique)
    # Dùng timestamp để đảm bảo unique
    order_code = int(time.time() * 1000) % 2147483647  # Max int32
    
    # Lưu order_code vào DB để map với order
    db.orders.update_one(
        {"_id": order["_id"]},
        {"$set": {"payos_order_code": order_code}}
    )
    
    # Tạo description ngắn gọn (max 25 chars)
    description = f"DH{str(order_code)[-8:]}"
    
    # Gọi PayOS API
    result = await payos_service.create_payment_link(
        order_code=order_code,
        amount=int(order["total_amount"]),
        description=description,
        buyer_name=current_user.get("full_name", ""),
        buyer_email=current_user.get("email", ""),
        buyer_phone=order.get("phone", ""),
        items=order.get("items", [])
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to create payment")
        )
    
    return {
        "order_id": order_id,
        "order_code": order_code,
        "payment_url": result["payment_url"],
        "qr_code": result.get("qr_code"),
        "amount": order["total_amount"]
    }


@router.post("/payos/webhook")
async def payos_webhook(request: Request):
    """
    PayOS Webhook endpoint
    
    PayOS gọi endpoint này khi có giao dịch thành công.
    QUAN TRỌNG: Phải validate signature để chống fake request!
    
    Webhook payload:
    {
        "code": "00",
        "desc": "success",
        "data": {
            "orderCode": 123,
            "amount": 50000,
            "description": "...",
            "code": "00",
            ...
        },
        "signature": "xxx"
    }
    """
    db = get_database()
    
    try:
        webhook_body = await request.json()
    except:
        return JSONResponse(
            {"success": False, "message": "Invalid JSON"}, 
            status_code=400
        )
    
    # VALIDATE SIGNATURE - BẮT BUỘC!
    verification = payos_service.verify_webhook_signature(webhook_body)
    
    if not verification.get("valid"):
        print(f"❌ Invalid webhook signature: {verification.get('message')}")
        return JSONResponse(
            {"success": False, "message": "Invalid signature"}, 
            status_code=401
        )
    
    order_code = verification["order_code"]
    print(f"✅ Valid webhook for order_code: {order_code}")
    
    # Tìm order theo payos_order_code
    order = db.orders.find_one({"payos_order_code": order_code})
    
    if not order:
        print(f"❌ Order not found for order_code: {order_code}")
        return JSONResponse(
            {"success": False, "message": "Order not found"}, 
            status_code=404
        )
    
    # Check status từ webhook
    if verification["status"] == "PAID":
        # Update payment status
        OrderModel.update_payment(
            db,
            str(order["_id"]),
            str(verification.get("transaction_id", order_code))
        )
        print(f"✅ Order {order['_id']} marked as PAID")
    
    # Trả về success cho PayOS
    return JSONResponse({"success": True})


@router.get("/payos/check/{order_id}")
async def check_payos_payment(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Kiểm tra trạng thái thanh toán từ PayOS
    
    Gọi API PayOS để lấy status mới nhất
    """
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check ownership (trừ admin)
    if current_user["role"] != "admin" and str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    order_code = order.get("payos_order_code")
    
    if not order_code:
        return {
            "order_id": order_id,
            "payment_status": order["payment_status"],
            "message": "No PayOS payment created for this order"
        }
    
    # Gọi PayOS API lấy status
    result = await payos_service.get_payment_info(order_code)
    
    if result["success"]:
        # Nếu PayOS báo PAID mà local chưa update
        if result["status"] == "PAID" and order["payment_status"] != "paid":
            OrderModel.update_payment(db, order_id, str(order_code))
            return {
                "order_id": order_id,
                "order_code": order_code,
                "payment_status": "paid",
                "payos_status": result["status"],
                "amount": result.get("amount")
            }
        
        return {
            "order_id": order_id,
            "order_code": order_code,
            "payment_status": order["payment_status"],
            "payos_status": result["status"],
            "amount": result.get("amount")
        }
    
    return {
        "order_id": order_id,
        "order_code": order_code,
        "payment_status": order["payment_status"],
        "payos_status": "UNKNOWN",
        "message": result.get("message")
    }


@router.get("/check/{order_id}")
async def check_payment_status(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Kiểm tra payment status từ local database"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if current_user["role"] != "admin" and str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return {
        "order_id": order_id,
        "payment_status": order["payment_status"],
        "payment_method": order["payment_method"],
        "paid_at": order.get("paid_at")
    }


@router.post("/payos/cancel/{order_id}")
async def cancel_payos_payment(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Hủy payment link PayOS"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if str(order["user_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    order_code = order.get("payos_order_code")
    if not order_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No PayOS payment to cancel"
        )
    
    result = await payos_service.cancel_payment(order_code)
    
    if result["success"]:
        OrderModel.cancel_order(db, order_id)
        return {"success": True, "message": "Payment cancelled"}
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=result.get("message", "Failed to cancel payment")
    )
