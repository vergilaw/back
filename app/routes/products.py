from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.schemas.product import (ProductCreate, ProductUpdate, ProductResponse, CategoryResponse)
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
    categories = CategoryModel.get_all_categories(db)  # ← Changed method name
    return categories

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
        product: ProductCreate,
        admin_user: dict = Depends(require_admin)
):

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
    return ProductModel.product_to_dict(new_product)


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
    return [ProductModel.product_to_dict(p) for p in products]


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


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):

    db = get_database()
    product = ProductModel.find_by_id(db, product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return ProductModel.product_to_dict(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
        product_id: str,
        product_update: ProductUpdate,
        admin_user: dict = Depends(require_admin)
):
    """
    Update product (Admin only)
    """
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

    return ProductModel.product_to_dict(updated_product)


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