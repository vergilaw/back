from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CartProductResponse(BaseModel):
    """Product info embedded in cart item"""
    id: str
    name: str
    category: Optional[str] = None
    price: float
    description: Optional[str] = None
    image: Optional[str] = None
    badge: Optional[str] = None
    is_available: bool

    model_config = ConfigDict(from_attributes=True)


class CartItemResponse(BaseModel):
    """Cart item returned to client"""
    cart_id: str
    quantity: int
    added_at: datetime
    product: CartProductResponse

    model_config = ConfigDict(from_attributes=True)


class CartAddRequest(BaseModel):
    """Body when adding product to cart"""
    quantity: int = Field(default=1, ge=1)


class CartUpdateRequest(BaseModel):
    """Body when updating cart item quantity (0 to remove)"""
    quantity: int = Field(..., ge=0)


class CartAddResponse(BaseModel):
    """Response after adding to cart"""
    message: str
    cart_id: str
    quantity: int


class CartTotalResponse(BaseModel):
    """Cart total calculation"""
    subtotal: float
    shipping: float
    total: float
    total_items: int

    model_config = ConfigDict(from_attributes=True)
