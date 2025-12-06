import hashlib
import hmac
import urllib.parse
from datetime import datetime
from typing import Optional
from app.config import settings


class VNPayService:
    """VNPay payment integration service"""

    def __init__(self):
        self.vnp_tmn_code = settings.VNPAY_TMN_CODE
        self.vnp_hash_secret = settings.VNPAY_HASH_SECRET
        self.vnp_url = settings.VNPAY_URL
        self.vnp_return_url = settings.VNPAY_RETURN_URL

    def create_payment_url(
        self,
        order_id: str,
        amount: float,
        order_desc: str,
        client_ip: str = "127.0.0.1"
    ) -> str:
        """Create VNPay payment URL"""
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.vnp_tmn_code,
            "vnp_Amount": int(amount * 100),  # VNPay uses amount * 100
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": order_id,
            "vnp_OrderInfo": order_desc,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": self.vnp_return_url,
            "vnp_IpAddr": client_ip,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }

        # Sort params
        sorted_params = sorted(vnp_params.items())
        query_string = urllib.parse.urlencode(sorted_params)

        # Create secure hash
        secure_hash = self._hmac_sha512(self.vnp_hash_secret, query_string)
        payment_url = f"{self.vnp_url}?{query_string}&vnp_SecureHash={secure_hash}"

        return payment_url

    def verify_payment(self, vnp_params: dict) -> dict:
        """Verify VNPay callback/return"""
        vnp_secure_hash = vnp_params.pop("vnp_SecureHash", None)
        vnp_params.pop("vnp_SecureHashType", None)

        # Sort and create query string
        sorted_params = sorted(vnp_params.items())
        query_string = urllib.parse.urlencode(sorted_params)

        # Verify hash
        calculated_hash = self._hmac_sha512(self.vnp_hash_secret, query_string)

        if vnp_secure_hash != calculated_hash:
            return {"success": False, "message": "Invalid signature"}

        response_code = vnp_params.get("vnp_ResponseCode")
        transaction_no = vnp_params.get("vnp_TransactionNo")
        order_id = vnp_params.get("vnp_TxnRef")
        amount = int(vnp_params.get("vnp_Amount", 0)) / 100

        if response_code == "00":
            return {
                "success": True,
                "message": "Payment successful",
                "order_id": order_id,
                "transaction_no": transaction_no,
                "amount": amount
            }
        else:
            return {
                "success": False,
                "message": f"Payment failed with code: {response_code}",
                "order_id": order_id,
                "response_code": response_code
            }

    def _hmac_sha512(self, key: str, data: str) -> str:
        """Create HMAC SHA512 hash"""
        return hmac.new(
            key.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()


vnpay_service = VNPayService()
