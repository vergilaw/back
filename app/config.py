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

    # PayOS Configuration (get from https://payos.vn)
    PAYOS_CLIENT_ID: str = "f9f072e8-6599-455b-94d2-f38c57a43c2c"
    PAYOS_API_KEY: str = "ed3bbc43-3542-4986-8f90-92c234c2f531"
    PAYOS_CHECKSUM_KEY: str = "0a47279c2540ca6e1908bc029252cfac202414964f58950121945c623e387b48"
    PAYOS_RETURN_URL: str = "http://localhost:5173/payment/success"
    PAYOS_CANCEL_URL: str = "http://localhost:5173/payment/cancel"

    # Frontend URL for redirects
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = "app/.env"
        extra = "ignore"
        case_sensitive = True


settings = Settings()