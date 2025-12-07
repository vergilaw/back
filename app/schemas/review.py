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
    order_id: Optional[str] = None
    rating: int
    comment: Optional[str]
    is_approved: bool
    is_pending: bool  # ← THÊM
    created_at: datetime
    user_name: Optional[str] = None


class ProductRating(BaseModel):
    avg_rating: float
    total_reviews: int


class CanReviewResponse(BaseModel):
    can_review: bool
    reason: Optional[str] = None
    order_id: Optional[str] = None
    has_reviewed: bool = False  # ← THÊM
