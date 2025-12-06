from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RecipeIngredient(BaseModel):
    ingredient_id: str
    quantity: float = Field(..., gt=0)
    unit: str


class RecipeCreate(BaseModel):
    product_id: str
    ingredients: List[RecipeIngredient]
    instructions: Optional[str] = None
    origin: Optional[str] = None  # Nguồn gốc nguyên liệu
    story: Optional[str] = None  # User story
    history: Optional[str] = None  # Lịch sử nguồn gốc bánh
    prep_time: Optional[int] = 0  # Phút
    cook_time: Optional[int] = 0
    servings: Optional[int] = 1


class RecipeUpdate(BaseModel):
    ingredients: Optional[List[RecipeIngredient]] = None
    instructions: Optional[str] = None
    origin: Optional[str] = None
    story: Optional[str] = None
    history: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None


class RecipeResponse(BaseModel):
    id: str
    product_id: str
    ingredients: List[dict]
    instructions: Optional[str]
    origin: Optional[str]
    story: Optional[str]
    history: Optional[str]
    prep_time: int
    cook_time: int
    servings: int
    created_at: datetime
    updated_at: datetime


class RecipeCost(BaseModel):
    total_cost: float
    details: List[dict]
