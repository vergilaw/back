from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "sweet_bakery"

    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DEBUG: bool = True

    DEFAULT_ADMIN_EMAIL: str = "admin111@sweetbakery.com"
    DEFAULT_ADMIN_PASSWORD: str = "admin111"

    # VNPay Sandbox Configuration
    VNPAY_TMN_CODE: str = "DEMOV210"  # Sandbox TMN Code
    VNPAY_HASH_SECRET: str = "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ"  # Sandbox Secret
    VNPAY_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:8000/api/payments/vnpay/callback"

    # Frontend URL for redirects
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()