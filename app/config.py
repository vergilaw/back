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

    PAYOS_CLIENT_ID: str = "your-payos-client-id"
    PAYOS_API_KEY: str = "your-payos-api-key"
    PAYOS_CHECKSUM_KEY: str = "your-payos-checksum-key"
    PAYOS_RETURN_URL: str = "http://localhost:5173/payment/success"
    PAYOS_CANCEL_URL: str = "http://localhost:5173/payment/cancel"

    FRONTEND_URL: str = "http://localhost:5173"

    GEMINI_API_KEY: str = "your-gemini-api-key"

    class Config:
        env_file = "app/.env"
        extra = "ignore"
        case_sensitive = True


settings = Settings()