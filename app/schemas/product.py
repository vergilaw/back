from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    product_count: int = 0


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=3)
    category: str  # birthday-cakes, bread-savory, cookies-minicakes, beverages
    price: float = Field(..., gt=0)
    description: str
    image: str  # URL
    badge: Optional[str] = None  # SPECIAL, NEW, POPULAR, BESTSELLER, HEALTHY


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    image: Optional[str] = None
    badge: Optional[str] = None
    is_available: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str
    image: str
    badge: Optional[str]
    is_available: bool
    created_at: datetime
    updated_at: datetime