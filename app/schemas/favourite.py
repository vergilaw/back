from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FavouriteProductResponse(BaseModel):
    """Product info in favourite response"""
    id: str
    name: str
    category: str
    price: float
    description: str
    image: str
    badge: Optional[str]
    is_available: bool


class FavouriteResponse(BaseModel):
    """Favourite response with product details"""
    favourite_id: str
    added_at: datetime
    product: FavouriteProductResponse


class FavouriteAddResponse(BaseModel):
    """Response when adding to favourites"""
    message: str
    product_id: str
    is_favourite: bool


class FavouriteCheckResponse(BaseModel):
    """Response for checking if product is favourite"""
    product_id: str
    is_favourite: bool


class FavouriteCountResponse(BaseModel):
    """Response for counting favourites"""
    count: int
