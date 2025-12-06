import hmac
import hashlib
import httpx
from typing import Optional
from app.config import settings


class PayOSService:
    """PayOS payment integration service - theo PayOS docs"""

    def __init__(self):
        self.client_id = settings.PAYOS_CLIENT_ID
        self.api_key = settings.PAYOS_API_KEY
        self.checksum_key = settings.PAYOS_CHECKSUM_KEY
        self.api_url = "https://api-merchant.payos.vn"
        self.return_url = settings.PAYOS_RETURN_URL
        self.cancel_url = settings.PAYOS_CANCEL_URL

    def _create_signature(self, data: dict) -> str:
        """
        Tạo signature theo PayOS docs:
        1. Sort keys theo alphabet
        2. Tạo query string: key1=value1&key2=value2
        3. Hash với HMAC-SHA256
        """
        # Sort keys theo alphabet
        sorted_keys = sorted(data.keys())
        
        # Tạo query string
        query_string = "&".join(
            f"{key}={data[key]}" for key in sorted_keys
        )
        
        # Hash với HMAC-SHA256
        signature = hmac.new(
            self.checksum_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature

    async def create_payment_link(
        self,
        order_code: int,
        amount: int,
        description: str,
        buyer_name: str = "",
        buyer_email: str = "",
        buyer_phone: str = "",
        items: list = None
    ) -> dict:
        """Tạo payment link - trả về QR code và checkout URL"""
        
        # Data để tạo signature (theo PayOS docs - chỉ 5 fields này)
        signature_data = {
            "amount": amount,
            "cancelUrl": self.cancel_url,
            "description": description[:25],  # PayOS limit 25 chars
            "orderCode": order_code,
            "returnUrl": self.return_url
        }
        
        signature = self._create_signature(signature_data)

        # Payload gửi lên PayOS
        payload = {
            "orderCode": order_code,
            "amount": amount,
            "description": description[:25],
            "cancelUrl": self.cancel_url,
            "returnUrl": self.return_url,
            "signature": signature
        }
        
        # Thêm optional fields
        if buyer_name:
            payload["buyerName"] = buyer_name
        if buyer_email:
            payload["buyerEmail"] = buyer_email
        if buyer_phone:
            payload["buyerPhone"] = buyer_phone
        
        # Thêm items nếu có
        if items:
            payos_items = []
            for item in items:
                payos_items.append({
                    "name": str(item.get("name", "San pham"))[:50],
                    "quantity": int(item.get("quantity", 1)),
                    "price": int(item.get("price", 0))
                })
            payload["items"] = payos_items

        headers = {
            "x-client-id": self.client_id,
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        # Debug log
        print("=" * 50)
        print("PayOS Request Debug:")
        print(f"URL: {self.api_url}/v2/payment-requests")
        print(f"Client ID: {self.client_id}")
        print(f"API Key: {self.api_key[:10]}...")
        print(f"Signature string: amount={amount}&cancelUrl={self.cancel_url}&description={description[:25]}&orderCode={order_code}&returnUrl={self.return_url}")
        print(f"Signature: {signature}")
        print(f"Payload: {payload}")
        print("=" * 50)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/v2/payment-requests",
                json=payload,
                headers=headers
            )
            result = response.json()
            print(f"PayOS Response: {result}")

        if result.get("code") == "00":
            data = result["data"]
            return {
                "success": True,
                "payment_url": data["checkoutUrl"],
                "qr_code": data.get("qrCode"),
                "order_code": order_code,
                "payment_link_id": data.get("paymentLinkId")
            }
        else:
            return {
                "success": False,
                "message": result.get("desc", "Payment creation failed"),
                "code": result.get("code")
            }

    async def get_payment_info(self, order_code: int) -> dict:
        """Lấy thông tin payment từ PayOS"""
        headers = {
            "x-client-id": self.client_id,
            "x-api-key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/v2/payment-requests/{order_code}",
                headers=headers
            )
            result = response.json()

        if result.get("code") == "00":
            data = result["data"]
            return {
                "success": True,
                "order_code": data["orderCode"],
                "amount": data["amount"],
                "status": data["status"],  # PENDING, PAID, CANCELLED
                "transaction_id": data.get("id"),
                "paid_at": data.get("createdAt")
            }
        else:
            return {
                "success": False,
                "message": result.get("desc", "Failed to get payment info")
            }

    def verify_webhook_signature(self, webhook_body: dict) -> dict:
        """
        Validate webhook signature từ PayOS
        QUAN TRỌNG: Phải validate để chống fake request
        
        Webhook payload format:
        {
            "code": "00",
            "desc": "success",
            "data": { ... transaction data ... },
            "signature": "xxx"
        }
        """
        received_signature = webhook_body.get("signature")
        data = webhook_body.get("data", {})
        
        if not received_signature or not data:
            return {"valid": False, "message": "Missing signature or data"}
        
        # Tạo signature từ data (sort theo alphabet)
        sorted_keys = sorted(data.keys())
        query_string = "&".join(
            f"{key}={data[key]}" for key in sorted_keys
        )
        
        expected_signature = hmac.new(
            self.checksum_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if received_signature != expected_signature:
            return {"valid": False, "message": "Invalid signature"}
        
        # Signature valid - extract payment info
        return {
            "valid": True,
            "order_code": data.get("orderCode"),
            "amount": data.get("amount"),
            "status": "PAID" if data.get("code") == "00" else "FAILED",
            "transaction_id": data.get("reference"),
            "description": data.get("description")
        }

    async def cancel_payment(self, order_code: int) -> dict:
        """Hủy payment link"""
        headers = {
            "x-client-id": self.client_id,
            "x-api-key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/v2/payment-requests/{order_code}/cancel",
                headers=headers
            )
            result = response.json()

        return {
            "success": result.get("code") == "00",
            "message": result.get("desc")
        }


payos_service = PayOSService()
