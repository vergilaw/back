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

class IngredientUsage(BaseModel):
    """Nguyên liệu cần thiết cho 1 sản phẩm"""
    ingredient_id: str
    quantity: float  # Số lượng cần dùng

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=3)
    category: str  # birthday-cakes, bread-savory, cookies-minicakes, beverages
    price: float = Field(..., gt=0)
    description: str
    image: str  # URL
    badge: Optional[str] = None  # SPECIAL, NEW, POPULAR, BESTSELLER, HEALTHY
    ingredients: Optional[List[IngredientUsage]] = []  # ← THÊM FIELD MỚI


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    image: Optional[str] = None
    badge: Optional[str] = None
    is_available: Optional[bool] = None
    ingredients: Optional[List[IngredientUsage]] = None  # ← THÊM

class IngredientDetail(BaseModel):
    """Thông tin chi tiết ingredient trong product"""
    ingredient_id: str
    name: str
    unit: str
    quantity_needed: float
    available_stock: float
    is_sufficient: bool

class RecipeIngredientInfo(BaseModel):
    name: str
    quantity: float
    unit: str


class RecipeInfo(BaseModel):
    ingredients: List[RecipeIngredientInfo]
    instructions: str = ""
    origin: str = ""
    story: str = ""
    history: str = ""
    prep_time: int = 0
    cook_time: int = 0
    servings: int = 1


class RecipeIngredientInfo(BaseModel):
    name: str
    quantity: float
    unit: str


class RecipeInfo(BaseModel):
    ingredients: List[RecipeIngredientInfo]
    instructions: str = ""
    origin: str = ""
    story: str = ""
    history: str = ""
    prep_time: int = 0
    cook_time: int = 0
    servings: int = 1


class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str
    image: str
    badge: Optional[str]
    is_available: bool
    ingredients: List[IngredientDetail] = []  # ← THÊM
    created_at: datetime
    updated_at: datetime


class ProductDetailResponse(ProductResponse):
    """Product with recipe info"""
    recipe: Optional[RecipeInfo] = None