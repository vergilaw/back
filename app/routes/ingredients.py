from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from app.schemas.ingredient import (
    IngredientCreate, IngredientUpdate, IngredientResponse, StockUpdate
)
from app.models.ingredient import IngredientModel
from app.utils.dependencies import get_current_active_admin
from app.database import get_database

router = APIRouter(prefix="/api/ingredients", tags=["Ingredients"])


@router.post("", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    data: IngredientCreate,
    admin: dict = Depends(get_current_active_admin)
):
    """Tạo nguyên liệu mới (Admin)"""
    db = get_database()
    ingredient = IngredientModel.create_ingredient(db, data.dict())
    return IngredientModel.ingredient_to_dict(ingredient)


@router.get("", response_model=List[IngredientResponse])
async def get_all_ingredients(
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy tất cả nguyên liệu (Admin)"""
    db = get_database()
    ingredients = IngredientModel.find_all(db)
    return [IngredientModel.ingredient_to_dict(i) for i in ingredients]


@router.get("/low-stock", response_model=List[IngredientResponse])
async def get_low_stock_ingredients(
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy nguyên liệu sắp hết (Admin)"""
    db = get_database()
    ingredients = IngredientModel.get_low_stock(db)
    return [IngredientModel.ingredient_to_dict(i) for i in ingredients]


@router.get("/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(
    ingredient_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy chi tiết nguyên liệu (Admin)"""
    db = get_database()
    ingredient = IngredientModel.find_by_id(db, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return IngredientModel.ingredient_to_dict(ingredient)


@router.put("/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: str,
    data: IngredientUpdate,
    admin: dict = Depends(get_current_active_admin)
):
    """Cập nhật nguyên liệu (Admin)"""
    db = get_database()
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    ingredient = IngredientModel.update_ingredient(db, ingredient_id, update_data)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return IngredientModel.ingredient_to_dict(ingredient)


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(
    ingredient_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Xóa nguyên liệu (Admin)"""
    db = get_database()
    if not IngredientModel.delete_ingredient(db, ingredient_id):
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return None


@router.post("/{ingredient_id}/import", response_model=IngredientResponse)
async def import_stock(
    ingredient_id: str,
    data: StockUpdate,
    admin: dict = Depends(get_current_active_admin)
):
    """Nhập kho (Admin)"""
    db = get_database()
    ingredient = IngredientModel.add_stock(
        db, ingredient_id, data.quantity, data.note or ""
    )
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return IngredientModel.ingredient_to_dict(ingredient)


@router.post("/{ingredient_id}/export", response_model=IngredientResponse)
async def export_stock(
    ingredient_id: str,
    data: StockUpdate,
    admin: dict = Depends(get_current_active_admin)
):
    """Xuất kho (Admin)"""
    db = get_database()
    ingredient = IngredientModel.reduce_stock(
        db, ingredient_id, data.quantity, data.note or ""
    )
    if not ingredient:
        raise HTTPException(status_code=400, detail="Not enough stock or ingredient not found")
    return IngredientModel.ingredient_to_dict(ingredient)


@router.get("/{ingredient_id}/history")
async def get_stock_history(
    ingredient_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy lịch sử nhập/xuất kho (Admin)"""
    db = get_database()
    history = IngredientModel.get_stock_history(db, ingredient_id)
    return [{
        "id": str(h["_id"]),
        "type": h["type"],
        "quantity": h["quantity"],
        "before": h["before"],
        "after": h["after"],
        "note": h.get("note", ""),
        "created_at": h["created_at"]
    } for h in history]
