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


@router.post("/login")
async def login_with_password(data: dict, request: Request):
    """Login with phone/email and password"""
    db = get_db(request)
    
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    if not phone and not email:
        raise HTTPException(status_code=400, detail="Phone or email is required")
    
    # Find user by phone or email
    query = {}
    if phone:
        query = {'phone': phone}
    elif email:
        query = {'email': email}
    
    user_doc = await db.users.find_one(query, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has password
    if not user_doc.get('password'):
        raise HTTPException(status_code=400, detail="No password set. Please use OTP login or reset password")
    
    # Verify password
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    if not pwd_context.verify(password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Get user's role
    role_doc = await db.roles.find_one({'id': user_doc['role_id']}, {"_id": 0})
    role_slug = role_doc['slug'] if role_doc else 'user'
    
    # Generate JWT token
    token = AuthService.create_access_token(
        user_id=user_doc['id'],
        tenant_id=user_doc['tenant_id'],
        role=role_slug
    )
    
    # Update last login
    await db.users.update_one(
        query,
        {'$set': {'last_login': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_doc['id'],
            "name": user_doc['name'],
            "phone": user_doc.get('phone'),
            "email": user_doc.get('email'),
            "role_id": role_slug,
            "tenant_id": user_doc['tenant_id']
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

@router.get("/roles")
async def get_all_roles(request: Request):
    """Get all available roles"""
    db = get_db(request)
    
    roles = await db.roles.find({"deleted_at": None}, {"_id": 0}).to_list(length=None)
    
    return roles


# ============ FORGOT PASSWORD ============

@router.post("/forgot-password")
async def forgot_password(login: UserLogin, request: Request):
    """Send OTP for password reset"""
    db = get_db(request)
    
    # Check if user exists
    user = await db.users.find_one({'phone': login.phone}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found with this phone number")
    
    # Generate OTP and reset token
    otp = AuthService.generate_otp()
    import uuid
    reset_token = str(uuid.uuid4())
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Update user with OTP and reset token
    await db.users.update_one(
        {'phone': login.phone},
        {'$set': {
            'reset_otp': otp,
            'reset_token': reset_token,
            'reset_otp_expires_at': otp_expires_at.isoformat()
        }}
    )
    
    # Send OTP via SMS
    await AuthService.send_otp_sms(login.phone, otp)
    
    return {
        "message": "Password reset OTP sent successfully",
        "phone": login.phone,
        "reset_token": reset_token,
        "otp": otp  # TODO: Remove in production
    }

@router.post("/verify-reset-otp")
async def verify_reset_otp(data: dict, request: Request):
    """Verify OTP for password reset"""
    db = get_db(request)
    
    phone = data.get('phone')
    otp = data.get('otp')
    reset_token = data.get('reset_token')
    
    if not phone or not otp or not reset_token:
        raise HTTPException(status_code=400, detail="Phone, OTP and reset token are required")
    
    # Find user
    user = await db.users.find_one({'phone': phone}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check OTP and token
    if user.get('reset_otp') != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if user.get('reset_token') != reset_token:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check if OTP expired
    otp_expires_at = user.get('reset_otp_expires_at')
    if otp_expires_at:
        expires = datetime.fromisoformat(otp_expires_at)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="OTP expired")
    
    return {
        "message": "OTP verified successfully",
        "phone": phone
    }

@router.post("/reset-password")
async def reset_password(data: dict, request: Request):
    """Reset password after OTP verification"""
    db = get_db(request)
    
    phone = data.get('phone')
    otp = data.get('otp')
    reset_token = data.get('reset_token')
    new_password = data.get('new_password')
    
    if not phone or not otp or not reset_token or not new_password:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    # Find user
    user = await db.users.find_one({'phone': phone}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify OTP and token again
    if user.get('reset_otp') != otp or user.get('reset_token') != reset_token:
        raise HTTPException(status_code=400, detail="Invalid OTP or reset token")
    
    # Check if OTP expired
    otp_expires_at = user.get('reset_otp_expires_at')
    if otp_expires_at:
        expires = datetime.fromisoformat(otp_expires_at)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="OTP expired. Please request a new one")
    
    # Hash new password
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash(new_password)
    
    # Update password and clear reset fields
    await db.users.update_one(
        {'phone': phone},
        {'$set': {
            'password': hashed_password,
            'updated_at': datetime.now(timezone.utc).isoformat()
        },
        '$unset': {
            'reset_otp': '',
            'reset_token': '',
            'reset_otp_expires_at': ''
        }}
    )
    
    return {
        "message": "Password reset successfully. Please login with your new password.",
        "phone": phone
    }

