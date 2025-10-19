from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import AuthService
from typing import Optional

security = HTTPBearer()

async def get_current_user(request: Request) -> dict:
    """Get current user from JWT token"""
    try:
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        parts = authorization.split()
        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization format"
            )
            
        scheme, token = parts
        if scheme.lower() != 'bearer':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        payload = AuthService.decode_token(token)
        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

async def get_current_tenant(request: Request) -> Optional[str]:
    """Get current tenant ID from JWT token"""
    try:
        user = await get_current_user(request)
        return user.get('tenant_id')
    except:
        return None

def require_role(required_roles: list):
    """Decorator to require specific roles"""
    async def role_checker(request: Request):
        user = await get_current_user(request)
        user_role = user.get('role')
        
        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return role_checker
