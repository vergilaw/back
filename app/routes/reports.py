from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from typing import Optional
import io

from app.utils.dependencies import get_current_active_admin
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/revenue")
async def get_revenue_report(
    period: str = Query("day", regex="^(day|week|month|year)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: dict = Depends(get_current_active_admin)
):
    """
    Báo cáo doanh thu
    - period: day, week, month, year
    - start_date, end_date: YYYY-MM-DD (optional)
    """
    db = get_database()
    
    # Xác định khoảng thời gian
    now = datetime.utcnow()
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
    else:
        if period == "day":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
        elif period == "week":
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=7)
        elif period == "month":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end = start.replace(year=now.year + 1, month=1)
            else:
                end = start.replace(month=now.month + 1)
        else:  # year
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = start.replace(year=now.year + 1)
    
    # Query orders
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start, "$lt": end},
            "payment_status": "paid"
        }},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total_amount"},
            "total_orders": {"$sum": 1},
            "avg_order_value": {"$avg": "$total_amount"}
        }}
    ]
    
    result = list(db.orders.aggregate(pipeline))
    
    # Doanh thu theo ngày
    daily_pipeline = [
        {"$match": {
            "created_at": {"$gte": start, "$lt": end},
            "payment_status": "paid"
        }},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "revenue": {"$sum": "$total_amount"},
            "orders": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_data = list(db.orders.aggregate(daily_pipeline))
    
    summary = result[0] if result else {
        "total_revenue": 0,
        "total_orders": 0,
        "avg_order_value": 0
    }
    
    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "summary": {
            "total_revenue": summary.get("total_revenue", 0),
            "total_orders": summary.get("total_orders", 0),
            "avg_order_value": round(summary.get("avg_order_value", 0), 0)
        },
        "daily_breakdown": [{
            "date": d["_id"],
            "revenue": d["revenue"],
            "orders": d["orders"]
        } for d in daily_data]
    }


@router.get("/top-products")
async def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    period: str = Query("month", regex="^(week|month|year|all)$"),
    admin: dict = Depends(get_current_active_admin)
):
    """Sản phẩm bán chạy nhất"""
    db = get_database()
    
    now = datetime.utcnow()
    match_query = {"payment_status": "paid"}
    
    if period != "all":
        if period == "week":
            start = now - timedelta(days=7)
        elif period == "month":
            start = now - timedelta(days=30)
        else:
            start = now - timedelta(days=365)
        match_query["created_at"] = {"$gte": start}
    
    pipeline = [
        {"$match": match_query},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "name": {"$first": "$items.name"},
            "total_sold": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": limit}
    ]
    
    results = list(db.orders.aggregate(pipeline))
    
    return {
        "period": period,
        "products": [{
            "product_id": r["_id"],
            "name": r["name"],
            "total_sold": r["total_sold"],
            "total_revenue": r["total_revenue"]
        } for r in results]
    }


@router.get("/profit")
async def get_profit_report(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    admin: dict = Depends(get_current_active_admin)
):
    """Báo cáo lợi nhuận (doanh thu - giá vốn)"""
    db = get_database()
    
    now = datetime.utcnow()
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=365)
    
    # Tính doanh thu
    revenue_pipeline = [
        {"$match": {"created_at": {"$gte": start}, "payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = list(db.orders.aggregate(revenue_pipeline))
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Tính giá vốn (từ stock history - xuất kho)
    cost_pipeline = [
        {"$match": {"created_at": {"$gte": start}, "type": "export"}},
        {"$lookup": {
            "from": "ingredients",
            "localField": "ingredient_id",
            "foreignField": "_id",
            "as": "ingredient"
        }},
        {"$unwind": "$ingredient"},
        {"$group": {
            "_id": None,
            "total": {"$sum": {"$multiply": ["$quantity", "$ingredient.price_per_unit"]}}
        }}
    ]
    cost_result = list(db.stock_history.aggregate(cost_pipeline))
    total_cost = cost_result[0]["total"] if cost_result else 0
    
    profit = total_revenue - total_cost
    margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return {
        "period": period,
        "start_date": start.isoformat(),
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "profit": profit,
        "profit_margin": round(margin, 2)
    }


@router.get("/orders-summary")
async def get_orders_summary(
    admin: dict = Depends(get_current_active_admin)
):
    """Tổng quan đơn hàng theo trạng thái"""
    db = get_database()
    
    pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total_amount": {"$sum": "$total_amount"}
        }}
    ]
    
    results = list(db.orders.aggregate(pipeline))
    
    summary = {r["_id"]: {"count": r["count"], "amount": r["total_amount"]} for r in results}
    
    return {
        "pending": summary.get("pending", {"count": 0, "amount": 0}),
        "paid": summary.get("paid", {"count": 0, "amount": 0}),
        "confirmed": summary.get("confirmed", {"count": 0, "amount": 0}),
        "shipping": summary.get("shipping", {"count": 0, "amount": 0}),
        "delivered": summary.get("delivered", {"count": 0, "amount": 0}),
        "cancelled": summary.get("cancelled", {"count": 0, "amount": 0})
    }


@router.get("/inventory-summary")
async def get_inventory_summary(
    admin: dict = Depends(get_current_active_admin)
):
    """Tổng quan tồn kho"""
    db = get_database()
    
    ingredients = list(db.ingredients.find({"is_active": True}))
    
    total_value = sum(i["quantity"] * i["price_per_unit"] for i in ingredients)
    low_stock = [i for i in ingredients if i["quantity"] <= i["min_quantity"]]
    
    return {
        "total_ingredients": len(ingredients),
        "total_inventory_value": total_value,
        "low_stock_count": len(low_stock),
        "low_stock_items": [{
            "id": str(i["_id"]),
            "name": i["name"],
            "quantity": i["quantity"],
            "min_quantity": i["min_quantity"],
            "unit": i["unit"]
        } for i in low_stock]
    }
