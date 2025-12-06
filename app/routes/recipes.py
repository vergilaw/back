from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeResponse, RecipeCost
from app.models.recipe import RecipeModel
from app.utils.dependencies import get_current_active_admin, get_current_active_user
from app.database import get_database

router = APIRouter(prefix="/api/recipes", tags=["Recipes"])


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    data: RecipeCreate,
    admin: dict = Depends(get_current_active_admin)
):
    """Tạo công thức mới (Admin)"""
    db = get_database()
    
    # Kiểm tra sản phẩm đã có công thức chưa
    existing = RecipeModel.find_by_product(db, data.product_id)
    if existing:
        raise HTTPException(status_code=400, detail="Product already has a recipe")
    
    recipe_data = data.dict()
    recipe_data["ingredients"] = [i.dict() for i in data.ingredients]
    
    recipe = RecipeModel.create_recipe(db, recipe_data)
    return RecipeModel.recipe_to_dict(recipe)


@router.get("/product/{product_id}", response_model=RecipeResponse)
async def get_recipe_by_product(product_id: str):
    """Lấy công thức của sản phẩm (Public)"""
    db = get_database()
    recipe = RecipeModel.find_by_product(db, product_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return RecipeModel.recipe_to_dict(recipe)


@router.get("/product/{product_id}/story")
async def get_product_story(product_id: str):
    """Lấy câu chuyện/lịch sử của sản phẩm (Public)"""
    db = get_database()
    recipe = RecipeModel.find_by_product(db, product_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {
        "product_id": product_id,
        "origin": recipe.get("origin", ""),
        "story": recipe.get("story", ""),
        "history": recipe.get("history", "")
    }


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: str):
    """Lấy công thức theo ID (Public)"""
    db = get_database()
    recipe = RecipeModel.find_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return RecipeModel.recipe_to_dict(recipe)


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: str,
    data: RecipeUpdate,
    admin: dict = Depends(get_current_active_admin)
):
    """Cập nhật công thức (Admin)"""
    db = get_database()
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    if "ingredients" in update_data:
        update_data["ingredients"] = [i.dict() if hasattr(i, 'dict') else i for i in update_data["ingredients"]]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    recipe = RecipeModel.update_recipe(db, recipe_id, update_data)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return RecipeModel.recipe_to_dict(recipe)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Xóa công thức (Admin)"""
    db = get_database()
    if not RecipeModel.delete_recipe(db, recipe_id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    return None


@router.get("/{recipe_id}/cost", response_model=RecipeCost)
async def get_recipe_cost(
    recipe_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Tính giá vốn công thức (Admin)"""
    db = get_database()
    return RecipeModel.calculate_cost(db, recipe_id)


@router.post("/product/{product_id}/deduct")
async def deduct_ingredients_for_product(
    product_id: str,
    quantity: int = 1,
    admin: dict = Depends(get_current_active_admin)
):
    """Trừ nguyên liệu khi bán sản phẩm (Admin)"""
    db = get_database()
    result = RecipeModel.deduct_ingredients(db, product_id, quantity)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result
