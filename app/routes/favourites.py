from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas.favourite import (
    FavouriteResponse,
    FavouriteAddResponse,
    FavouriteCheckResponse,
    FavouriteCountResponse
)
from app.models.favourite import FavouriteModel
from app.models.product import ProductModel
from app.utils.dependencies import get_current_active_user
from app.database import get_database

router = APIRouter(prefix="/api/favourites", tags=["Favourites"])


@router.get("", response_model=List[FavouriteResponse])
async def get_favourites(
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100),
        current_user: dict = Depends(get_current_active_user)
):
    """Get all favourites for current user"""
    db = get_database()
    user_id = str(current_user["_id"])
    favourites = FavouriteModel.get_user_favourites(db, user_id, skip, limit)
    return favourites


@router.get("/count", response_model=FavouriteCountResponse)
async def count_favourites(current_user: dict = Depends(get_current_active_user)):
    """Get count of user's favourites"""
    db = get_database()
    user_id = str(current_user["_id"])
    count = FavouriteModel.count_user_favourites(db, user_id)
    return {"count": count}


@router.get("/check/{product_id}", response_model=FavouriteCheckResponse)
async def check_favourite(
        product_id: str,
        current_user: dict = Depends(get_current_active_user)
):
    """Check if a product is in user's favourites"""
    db = get_database()
    user_id = str(current_user["_id"])

    product = ProductModel.find_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    is_favourite = FavouriteModel.check_is_favourite(db, user_id, product_id)
    return {"product_id": product_id, "is_favourite": is_favourite}


@router.post("/{product_id}", response_model=FavouriteAddResponse)
async def add_to_favourites(
        product_id: str,
        current_user: dict = Depends(get_current_active_user)
):
    """Add product to favourites"""
    db = get_database()
    user_id = str(current_user["_id"])

    product = ProductModel.find_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if not product.get("is_available", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not available"
        )

    FavouriteModel.add_favourite(db, user_id, product_id)

    return {
        "message": "Product added to favourites",
        "product_id": product_id,
        "is_favourite": True
    }


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
async def remove_from_favourites(
        product_id: str,
        current_user: dict = Depends(get_current_active_user)
):
    """Remove product from favourites"""
    db = get_database()
    user_id = str(current_user["_id"])

    success = FavouriteModel.remove_favourite(db, user_id, product_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favourite not found"
        )

    return {
        "message": "Product removed from favourites",
        "product_id": product_id,
        "is_favourite": False
    }


@router.delete("", status_code=status.HTTP_200_OK)
async def clear_favourites(current_user: dict = Depends(get_current_active_user)):
    """Clear all favourites for current user"""
    db = get_database()
    user_id = str(current_user["_id"])

    success = FavouriteModel.clear_user_favourites(db, user_id)

    return {
        "message": "All favourites cleared",
        "success": success
    }
