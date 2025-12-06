from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class IngredientCreate(BaseModel):
    name: str = Field(..., min_length=2)
    unit: str  # kg, g, lít, ml, cái, gói
    price_per_unit: float = Field(..., gt=0)
    quantity: float = Field(default=0, ge=0)
    min_quantity: float = Field(default=10, ge=0)
    supplier: Optional[str] = None
    description: Optional[str] = None


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    price_per_unit: Optional[float] = Field(None, gt=0)
    min_quantity: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = None
    description: Optional[str] = None


class IngredientResponse(BaseModel):
    id: str
    name: str
    unit: str
    price_per_unit: float
    quantity: float
    min_quantity: float
    supplier: Optional[str]
    description: Optional[str]
    is_active: bool
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime


class StockUpdate(BaseModel):
    quantity: float = Field(..., gt=0)
    note: Optional[str] = None
