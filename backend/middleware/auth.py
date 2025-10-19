from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import AuthService
from typing import Optional

security = HTTPBearer()

async def get_current_user(request: Request) -> dict:
    """Get current user from JWT token"""
    try:
        authorization: str = request.headers.get("Authorization")
        print(f"DEBUG: Authorization header: {authorization}")
        if not authorization:
            print("DEBUG: No authorization header")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        parts = authorization.split()
        if len(parts) != 2:
            print(f"DEBUG: Invalid authorization format: {parts}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization format"
            )
            
        scheme, token = parts
        print(f"DEBUG: Scheme: {scheme}, Token: {token[:50]}...")
        if scheme.lower() != 'bearer':
            print(f"DEBUG: Invalid scheme: {scheme}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        payload = AuthService.decode_token(token)
        print(f"DEBUG: Decoded payload: {payload}")
        return payload
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Exception in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"401: {str(e)}"
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
