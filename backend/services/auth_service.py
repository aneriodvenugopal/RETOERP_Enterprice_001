import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import os

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

class AuthService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a random OTP"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def create_access_token(user_id: str, tenant_id: Optional[str] = None, role: str = 'user') -> str:
        """Create JWT access token"""
        payload = {
            'user_id': user_id,
            'tenant_id': tenant_id,
            'role': role,
            'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and verify JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception("Token has expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")
    
    @staticmethod
    async def send_otp_sms(phone: str, otp: str) -> bool:
        """Send OTP via SMS using notification service"""
        from services.notification_service import NotificationService
        
        notification_service = NotificationService()
        response = await notification_service.send_otp_sms(phone, otp)
        
        return response.get('success', False)
    
    @staticmethod
    def validate_otp_expiry(otp_expires_at: datetime) -> bool:
        """Check if OTP is still valid"""
        if not otp_expires_at:
            return False
        return datetime.now(timezone.utc) < otp_expires_at
