from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse

from app.schemas.order import PaymentUrlResponse
from app.models.order import OrderModel
from app.utils.vnpay import vnpay_service
from app.utils.dependencies import get_current_active_user
from app.database import get_database
from app.config import settings

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/vnpay/{order_id}", response_model=PaymentUrlResponse)
async def create_vnpay_payment(
    order_id: str,
    request: Request,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create VNPay payment URL for an order
    
    Returns payment URL to redirect user to VNPay
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
    
    # Get client IP
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Create payment URL
    payment_url = vnpay_service.create_payment_url(
        order_id=order_id,
        amount=order["total_amount"],
        order_desc=f"Thanh toan don hang {order_id}",
        client_ip=client_ip
    )
    
    return {
        "order_id": order_id,
        "payment_url": payment_url,
        "amount": order["total_amount"]
    }


@router.get("/vnpay/callback")
async def vnpay_callback(request: Request):
    """
    VNPay callback URL - called by VNPay after payment
    
    This endpoint verifies the payment and updates order status
    """
    db = get_database()
    
    # Get all query params
    vnp_params = dict(request.query_params)
    
    if not vnp_params:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No payment data received"
        )
    
    # Verify payment
    result = vnpay_service.verify_payment(vnp_params)
    
    if result["success"]:
        # Update order payment status
        order = OrderModel.update_payment(
            db,
            result["order_id"],
            result["transaction_no"]
        )
        
        if order:
            # Redirect to frontend success page
            frontend_url = settings.FRONTEND_URL
            return RedirectResponse(
                url=f"{frontend_url}/payment/success?order_id={result['order_id']}"
            )
    
    # Payment failed - redirect to failure page
    frontend_url = settings.FRONTEND_URL
    return RedirectResponse(
        url=f"{frontend_url}/payment/failed?order_id={result.get('order_id', '')}&message={result['message']}"
    )


@router.get("/vnpay/ipn")
async def vnpay_ipn(request: Request):
    """
    VNPay IPN (Instant Payment Notification)
    
    Server-to-server notification from VNPay
    """
    db = get_database()
    vnp_params = dict(request.query_params)
    
    if not vnp_params:
        return {"RspCode": "99", "Message": "Invalid request"}
    
    result = vnpay_service.verify_payment(vnp_params)
    
    if result["success"]:
        order = OrderModel.find_by_id(db, result["order_id"])
        
        if not order:
            return {"RspCode": "01", "Message": "Order not found"}
        
        if order["payment_status"] == "paid":
            return {"RspCode": "02", "Message": "Order already confirmed"}
        
        # Update payment
        OrderModel.update_payment(db, result["order_id"], result["transaction_no"])
        return {"RspCode": "00", "Message": "Confirm Success"}
    
    return {"RspCode": "97", "Message": "Invalid signature"}


@router.get("/check/{order_id}")
async def check_payment_status(
    order_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Check payment status of an order"""
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
            detail="Not authorized"
        )
    
    return {
        "order_id": order_id,
        "payment_status": order["payment_status"],
        "payment_method": order["payment_method"],
        "transaction_id": order.get("vnpay_transaction_id"),
        "paid_at": order.get("paid_at")
    }
