from fastapi import APIRouter, HTTPException, Request, Depends
from models.user import User, UserCreate, UserLogin, OTPVerify
from services.auth_service import AuthService
from datetime import datetime, timedelta, timezone
from utils.helpers import serialize_doc, deserialize_doc
from typing import Optional

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/send-otp")
async def send_otp(login: UserLogin, request: Request):
    """Send OTP to user's phone"""
    db = get_db(request)
    
    # Check if user exists
    user = await db.users.find_one({'phone': login.phone}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    
    # Generate OTP
    otp = AuthService.generate_otp()
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Update user with OTP
    await db.users.update_one(
        {'phone': login.phone},
        {'$set': {
            'otp': otp,
            'otp_expires_at': otp_expires_at.isoformat()
        }}
    )
    
    # Send OTP via SMS
    await AuthService.send_otp_sms(login.phone, otp)
    
    return {
        "message": "OTP sent successfully",
        "phone": login.phone,
        "otp": otp  # TODO: Remove in production
    }

@router.post("/verify-otp")
async def verify_otp(verify: OTPVerify, request: Request):
    """Verify OTP and login user"""
    db = get_db(request)
    
    # Find user
    user_doc = await db.users.find_one({'phone': verify.phone}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc = deserialize_doc(user_doc)
    user = User(**user_doc)
    
    # Verify OTP
    if user.otp != verify.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check OTP expiry
    if not AuthService.validate_otp_expiry(user.otp_expires_at):
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Get user's role
    role_doc = await db.roles.find_one({'id': user.role_id}, {"_id": 0})
    role_slug = role_doc['slug'] if role_doc else 'user'
    
    # Generate JWT token
    token = AuthService.create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        role=role_slug
    )
    
    # Update last login
    await db.users.update_one(
        {'phone': verify.phone},
        {'$set': {
            'last_login': datetime.now(timezone.utc).isoformat(),
            'otp': None,  # Clear OTP after successful login
            'otp_expires_at': None
        }}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": role_slug,
            "tenant_id": user.tenant_id
        }
    }

@router.post("/register")
async def register(user_create: UserCreate, request: Request):
    """Register a new user"""
    db = get_db(request)
    
    # Check if user already exists
    existing_user = await db.users.find_one({'phone': user_create.phone}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this phone already exists")
    
    # Check if role exists
    role = await db.roles.find_one({'id': user_create.role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create user
    user = User(**user_create.model_dump())
    user_doc = serialize_doc(user.model_dump())
    
    await db.users.insert_one(user_doc)
    
    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email
        }
    }

@router.get("/me")
async def get_current_user_info(request: Request):
    """Get current user information"""
    from middleware.auth import get_current_user
    
    user_payload = await get_current_user(request)
    db = get_db(request)
    
    # Get user details
    user_doc = await db.users.find_one({'id': user_payload['user_id']}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc = deserialize_doc(user_doc)
    user = User(**user_doc)
    
    # Get role details
    role_doc = await db.roles.find_one({'id': user.role_id}, {"_id": 0})
    
    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "role": role_doc,
        "tenant_id": user.tenant_id,
        "is_active": user.is_active,
        "last_login": user.last_login
    }
