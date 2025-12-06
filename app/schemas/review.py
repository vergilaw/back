from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    order_id: str
    rating: int
    comment: Optional[str]
    is_approved: bool
    created_at: datetime


class ProductRating(BaseModel):
    avg_rating: float
    total_reviews: int
