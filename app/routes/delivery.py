from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import io

from app.models.order import OrderModel
from app.utils.dependencies import get_current_active_admin
from app.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/delivery", tags=["Delivery"])


@router.get("/{order_id}/slip")
async def get_delivery_slip(
    order_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy thông tin phiếu giao hàng (Admin)"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Lấy thông tin user
    user = db.users.find_one({"_id": order["user_id"]})
    
    return {
        "slip_number": f"PGH-{order_id[-8:].upper()}",
        "order_id": order_id,
        "created_at": datetime.utcnow().isoformat(),
        "order_date": order["created_at"].isoformat(),
        
        "sender": {
            "name": "Sweet Bakery",
            "address": "123 Đường ABC, Quận 1, TP.HCM",
            "phone": "0901234567"
        },
        
        "receiver": {
            "name": user["full_name"] if user else "N/A",
            "address": order["shipping_address"],
            "phone": order["phone"]
        },
        
        "items": [{
            "name": item["name"],
            "quantity": item["quantity"],
            "price": item["price"],
            "subtotal": item["price"] * item["quantity"]
        } for item in order["items"]],
        
        "total_amount": order["total_amount"],
        "payment_method": order["payment_method"],
        "payment_status": order["payment_status"],
        "note": order.get("note", ""),
        "status": order["status"]
    }


@router.get("/{order_id}/slip/html")
async def get_delivery_slip_html(
    order_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy phiếu giao hàng dạng HTML để in (Admin)"""
    db = get_database()
    order = OrderModel.find_by_id(db, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    user = db.users.find_one({"_id": order["user_id"]})
    
    # Tạo HTML
    items_html = ""
    for i, item in enumerate(order["items"], 1):
        subtotal = item["price"] * item["quantity"]
        items_html += f"""
        <tr>
            <td>{i}</td>
            <td>{item["name"]}</td>
            <td>{item["quantity"]}</td>
            <td>{item["price"]:,.0f}đ</td>
            <td>{subtotal:,.0f}đ</td>
        </tr>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Phiếu giao hàng - {order_id[-8:].upper()}</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }}
            .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }}
            .header h1 {{ margin: 0; color: #d4a574; }}
            .info-section {{ display: flex; justify-content: space-between; margin: 20px 0; }}
            .info-box {{ width: 45%; }}
            .info-box h3 {{ margin-bottom: 5px; color: #333; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background: #f5f5f5; }}
            .total {{ text-align: right; font-size: 18px; font-weight: bold; }}
            .footer {{ margin-top: 30px; display: flex; justify-content: space-between; }}
            .signature {{ text-align: center; width: 200px; }}
            .signature-line {{ border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }}
            .note {{ background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }}
            @media print {{ body {{ padding: 0; }} }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🧁 SWEET BAKERY</h1>
            <h2>PHIẾU GIAO HÀNG</h2>
            <p>Mã phiếu: <strong>PGH-{order_id[-8:].upper()}</strong></p>
            <p>Ngày: {datetime.utcnow().strftime("%d/%m/%Y %H:%M")}</p>
        </div>
        
        <div class="info-section">
            <div class="info-box">
                <h3>NGƯỜI GỬI</h3>
                <p><strong>Sweet Bakery</strong></p>
                <p>123 Đường ABC, Quận 1, TP.HCM</p>
                <p>SĐT: 0901234567</p>
            </div>
            <div class="info-box">
                <h3>NGƯỜI NHẬN</h3>
                <p><strong>{user["full_name"] if user else "N/A"}</strong></p>
                <p>{order["shipping_address"]}</p>
                <p>SĐT: {order["phone"]}</p>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        
        <p class="total">TỔNG CỘNG: {order["total_amount"]:,.0f}đ</p>
        <p>Thanh toán: <strong>{"Đã thanh toán" if order["payment_status"] == "paid" else "COD - Thu tiền khi giao"}</strong></p>
        
        {"<div class='note'><strong>Ghi chú:</strong> " + order.get("note", "") + "</div>" if order.get("note") else ""}
        
        <div class="footer">
            <div class="signature">
                <div class="signature-line">Người gửi</div>
            </div>
            <div class="signature">
                <div class="signature-line">Người vận chuyển</div>
            </div>
            <div class="signature">
                <div class="signature-line">Người nhận</div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return StreamingResponse(
        io.BytesIO(html.encode('utf-8')),
        media_type="text/html",
        headers={"Content-Disposition": f"inline; filename=delivery-slip-{order_id[-8:]}.html"}
    )
