from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas.cart import (
    CartItemResponse,
    CartAddRequest,
    CartUpdateRequest,
    CartTotalResponse,
    CartAddResponse
)
from app.models.cart import CartModel
from app.models.product import ProductModel
from app.utils.dependencies import get_current_active_user
from app.database import get_database

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.get("")
async def get_cart(current_user: dict = Depends(get_current_active_user)):
    """Get user's cart with product details"""
    db = get_database()
    user_id = str(current_user["_id"])
    cart_items = CartModel.get_user_cart(db, user_id)
    return cart_items


@router.get("/total")
async def get_cart_total(current_user: dict = Depends(get_current_active_user)):
    """Get cart total calculation"""
    db = get_database()
    user_id = str(current_user["_id"])
    total = CartModel.get_cart_total(db, user_id)
    return total


@router.post("/{product_id}")
async def add_to_cart(
        product_id: str,
        request: CartAddRequest,
        current_user: dict = Depends(get_current_active_user)
):
    """Add product to cart or increase quantity"""
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

    cart_item = CartModel.add_to_cart(db, user_id, product_id, request.quantity)

    return {
        "message": "Product added to cart",
        "cart_id": str(cart_item["_id"]),
        "quantity": cart_item["quantity"]
    }


@router.put("/{product_id}", status_code=status.HTTP_200_OK)
async def update_cart_quantity(
        product_id: str,
        request: CartUpdateRequest,
        current_user: dict = Depends(get_current_active_user)
):
    """Update cart item quantity. Set quantity to 0 to remove item"""
    db = get_database()
    user_id = str(current_user["_id"])

    success = CartModel.update_quantity(db, user_id, product_id, request.quantity)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    if request.quantity == 0:
        return {"message": "Item removed from cart"}

    return {"message": "Cart updated", "quantity": request.quantity}


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
async def remove_from_cart(
        product_id: str,
        current_user: dict = Depends(get_current_active_user)
):
    """Remove product from cart"""
    db = get_database()
    user_id = str(current_user["_id"])

    success = CartModel.remove_from_cart(db, user_id, product_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    return {
        "message": "Product removed from cart",
        "product_id": product_id
    }


@router.delete("", status_code=status.HTTP_200_OK)
async def clear_cart(current_user: dict = Depends(get_current_active_user)):
    """Clear all items from cart"""
    db = get_database()
    user_id = str(current_user["_id"])

    CartModel.clear_cart(db, user_id)

    return {
        "message": "All cart items cleared",
        "success": True
    }
