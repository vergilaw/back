from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.user import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    UserUpdate, ChangePasswordRequest
)
from app.models.user import UserModel
from app.utils.security import verify_password, create_access_token
from app.utils.dependencies import get_current_user_id, get_current_user, get_current_active_user
from app.database import get_database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user (role: user by default)

    - **email**: Valid email address (unique)
    - **password**: Minimum 6 characters
    - **full_name**: User's full name
    - **phone**: Phone number

    New users are created with 'user' role by default.
    """
    db = get_database()

    existing_user = UserModel.find_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    plain_password = user_data.password

    new_user = UserModel.create_user(db, {
        "email": user_data.email,
        "password": plain_password,
        "full_name": user_data.full_name,
        "phone": user_data.phone
    }, role="user")

    access_token = create_access_token(data={"sub": str(new_user["_id"])})
    user_response = UserModel.user_to_dict(new_user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


'''
@router.post("/register-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(user_data: UserRegister):
    """
    Register a new admin user (role: admin)
    In production, this endpoint should be protected or removed!
    For development/testing only.
    """
    db = get_database()

    existing_user = UserModel.find_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # WARNING: Storing plaintext password - FOR TESTING ONLY!
    plain_password = user_data.password

    new_user = UserModel.create_user(db, {
        "email": user_data.email,
        "password": plain_password, 
        "full_name": user_data.full_name,
        "phone": user_data.phone
    }, role="admin")

    access_token = create_access_token(data={"sub": str(new_user["_id"])})
    user_response = UserModel.user_to_dict(new_user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }
'''


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login user (both admin and regular users)

    - **email**: Registered email
    - **password**: User password
    """
    db = get_database()

    user = UserModel.find_by_email(db, credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    access_token = create_access_token(data={"sub": str(user["_id"])})
    user_response = UserModel.user_to_dict(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """
    Get current logged-in user information
    Requires: Authorization header with Bearer token
    """
    return UserModel.user_to_dict(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
        user_update: UserUpdate,
        current_user: dict = Depends(get_current_active_user)
):
    """
    Update current user information
    """
    db = get_database()

    update_data = {k: v for k, v in user_update.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )

    updated_user = UserModel.update_user(db, str(current_user["_id"]), update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserModel.user_to_dict(updated_user)


@router.post("/change-password")
async def change_password(
        password_data: ChangePasswordRequest,
        current_user: dict = Depends(get_current_active_user)
):
    db = get_database()

    if not verify_password(password_data.old_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    new_password_plain = password_data.new_password
    success = UserModel.update_password(db, str(current_user["_id"]), new_password_plain)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )

    return {"message": "Password changed successfully"}
