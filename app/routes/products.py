from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from bson import ObjectId
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductDetailResponse, CategoryResponse
)
from app.models.product import ProductModel, CategoryModel
from app.utils.dependencies import require_admin, get_current_active_user
from app.database import get_database

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """
    Get all categories with product count (Public)
    Categories are dynamically generated from products in database
    """
    db = get_database()
    categories = CategoryModel.get_all_categories(db)
    return categories


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate,
        admin_user: dict = Depends(require_admin)
):
    """Create new product (Admin only)"""
    db = get_database()

    valid_categories = ["birthday-cakes", "bread-savory", "cookies-minicakes", "beverages"]
    if product.category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )

    if product.badge:
        valid_badges = ["SPECIAL", "NEW", "POPULAR", "BESTSELLER", "HEALTHY"]
        if product.badge.upper() not in valid_badges:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid badge. Must be one of: {', '.join(valid_badges)}"
            )
        product.badge = product.badge.upper()

    new_product = ProductModel.create_product(db, product.dict())
    return ProductModel.product_to_dict(new_product, db)  # ← THÊM db


@router.get("", response_model=List[ProductResponse])
async def get_products(
        skip: int = Query(0, ge=0),
        limit: int = Query(20, ge=1, le=100),
        category: Optional[str] = None,
        search: Optional[str] = None
):
    """
    Get all products with pagination and filters (Public)

    - **skip**: Number of items to skip (for pagination)
    - **limit**: Maximum number of items to return (max 100)
    - **category**: Filter by category (birthday-cakes, bread-savory, cookies-minicakes, beverages, all)
    - **search**: Search by product name
    """
    db = get_database()
    products = ProductModel.find_all(
        db,
        skip=skip,
        limit=limit,
        category=category,
        search=search
    )
    return [ProductModel.product_to_dict(p, db) for p in products]  # ← THÊM db


@router.get("/count")
async def count_products(category: Optional[str] = None):
    """
    Count products by category (Public)

    Returns the total count of available products.
    If category is provided, returns count for that category.
    """
    db = get_database()
    count = ProductModel.count_products(db, category)
    return {"count": count, "category": category or "all"}


@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(product_id: str):
    """
    Get product detail with recipe info (Public)

    Returns product info + recipe (ingredients, story, origin, history)
    """
    db = get_database()
    product = ProductModel.find_by_id(db, product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    result = ProductModel.product_to_dict(product, db)  # ← THÊM db

    # Lấy recipe của sản phẩm
    from app.models.recipe import RecipeModel
    recipe = RecipeModel.find_by_product(db, product_id)

    if recipe:
        # Lấy tên nguyên liệu
        ingredients_detail = []
        for item in recipe.get("ingredients", []):
            ingredient = db.ingredients.find_one({"_id": ObjectId(item["ingredient_id"])})
            if ingredient:
                ingredients_detail.append({
                    "name": ingredient["name"],
                    "quantity": item["quantity"],
                    "unit": item["unit"]
                })

        result["recipe"] = {
            "ingredients": ingredients_detail,
            "instructions": recipe.get("instructions", ""),
            "origin": recipe.get("origin", ""),
            "story": recipe.get("story", ""),
            "history": recipe.get("history", ""),
            "prep_time": recipe.get("prep_time", 0),
            "cook_time": recipe.get("cook_time", 0),
            "servings": recipe.get("servings", 1)
        }
    else:
        result["recipe"] = None

    return result


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
        product_id: str,
        product_update: ProductUpdate,
        admin_user: dict = Depends(require_admin)
):
    """Update product (Admin only)"""
    db = get_database()

    update_data = {k: v for k, v in product_update.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )

    if "category" in update_data:
        valid_categories = ["birthday-cakes", "bread-savory", "cookies-minicakes", "beverages"]
        if update_data["category"] not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )

    if "badge" in update_data and update_data["badge"]:
        valid_badges = ["SPECIAL", "NEW", "POPULAR", "BESTSELLER", "HEALTHY"]
        if update_data["badge"].upper() not in valid_badges:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid badge. Must be one of: {', '.join(valid_badges)}"
            )
        update_data["badge"] = update_data["badge"].upper()

    updated_product = ProductModel.update_product(db, product_id, update_data)

    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return ProductModel.product_to_dict(updated_product, db)  # ← THÊM db


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
        product_id: str,
        admin_user: dict = Depends(require_admin)
):
    """
    Delete product (soft delete - Admin only)

    Product will be marked as unavailable instead of being permanently deleted.
    """
    db = get_database()
    success = ProductModel.delete_product(db, product_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return None


# ← THÊM ENDPOINT MỚI
@router.get("/{product_id}/check-ingredients")
async def check_product_ingredients(
        product_id: str,
        quantity: int = Query(1, ge=1),
        current_user: dict = Depends(get_current_active_user)
):
    """
    Kiểm tra tồn kho nguyên liệu cho sản phẩm (User phải login)

    - **product_id**: ID sản phẩm
    - **quantity**: Số lượng sản phẩm muốn làm (default: 1)

    Returns:
    - available: bool (có đủ nguyên liệu không)
    - missing: List[dict] (nguyên liệu thiếu hụt nếu có)
    """
    db = get_database()
    result = ProductModel.check_ingredients_availability(db, product_id, quantity)

    if not result["available"]:
        return {
            **result,
            "message": f"Not enough ingredients to make {quantity} unit(s)"
        }

    return {
        **result,
        "message": f"All ingredients available for {quantity} unit(s)"
    }