from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, products, questions, orders, payments, ingredients, reviews, recipes, reports, delivery, admin
from app.config import settings
from app.models.user import UserModel
from app.utils.security import verify_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    print("Starting up...")
    db = connect_to_mongo()

    create_default_admin(db)

    yield

    print("Shutting down...")
    close_mongo_connection()


def create_default_admin(db):
    """
    Create default admin user on startup if not exists
    Email: admin111@sweetbakery.com
    Password: admin111
    """
    admin_email = "admin111@sweetbakery.com"
    admin_password = "admin111"

    existing_admin = UserModel.find_by_email(db, admin_email)

    if not existing_admin:
        print(f"Creating default admin user: {admin_email}")
        UserModel.create_user(db, {
            "email": admin_email,
            "password": admin_password,
            "full_name": "Default Admin",
            "phone": "0000000000"
        }, role="admin")
        print(f"✓ Default admin created successfully!")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print(f"  Please change password after first login!")
    else:
        if verify_password(admin_password, existing_admin["password"]):
            print(f"✓ Default admin already exists: {admin_email}")
            print(f"  Password: {admin_password} (unchanged)")
        else:
            print(f"✓ Admin user exists: {admin_email}")
            print(f"  Password has been changed from default")


app = FastAPI(
    title="Sweet Bakery API",
    description="Backend API for Sweet Bakery - Online bakery shop with admin & user roles",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(questions.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(ingredients.router)
app.include_router(reviews.router)
app.include_router(recipes.router)
app.include_router(reports.router)
app.include_router(delivery.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Sweet Bakery API",
        "docs": "/docs",
        "version": "1.0.0",
        "features": [
            "User Authentication (Admin & User roles)",
            "Product Management (CRUD)",
            "Orders & PayOS Payment",
            "Ingredients Management",
            "Recipe Management",
            "Reviews & Ratings",
            "Reports & Analytics",
            "Delivery Slips"
        ],
        "default_admin": {
            "email": "admin111@sweetbakery.com",
            "password": "admin111",
            "note": "Change password after first login"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }
