from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int = Field(..., ge=1)
    image: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: str = Field(..., min_length=10)
    phone: str = Field(..., min_length=10, max_length=15)
    note: Optional[str] = None
    payment_method: str = "cod"  # cod, vnpay


class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[dict]
    total_amount: float
    shipping_address: str
    phone: str
    note: Optional[str]
    payment_method: str
    payment_status: str
    status: str
    vnpay_transaction_id: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdate(BaseModel):
    status: str  # pending, paid, confirmed, shipping, delivered, cancelled


class PaymentUrlResponse(BaseModel):
    order_id: str
    payment_url: str
    amount: float
