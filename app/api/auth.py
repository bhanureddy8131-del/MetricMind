"""
Authentication Routes
Endpoints for user registration, login, and authentication.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    LoginRequest, RegisterRequest, TokenResponse, UserResponse,
    ErrorResponse, LogoutRequest
)
from app.services.auth_service import AuthService
from app.security import decode_token, get_token_from_header

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/auth", tags=["authentication"])


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """
    Dependency to get current authenticated user from token.
    
    Args:
        authorization: Authorization header
        db: Database session
        
    Returns:
        User data dict
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    token = get_token_from_header(authorization)
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization token"
        )
    
    token_data = decode_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
    return {
        "user_id": token_data.user_id,
        "username": token_data.username,
        "email": token_data.email,
        "role": token_data.role
    }


@router.post("/register", response_model=TokenResponse)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    Args:
        request: Registration request with email, password, etc.
        db: Database session
        
    Returns:
        TokenResponse with access token and user info
    """
    try:
        # Register user
        user = AuthService.register(db, request)
        
        # Create token for immediate login
        token = AuthService.login(
            db,
            LoginRequest(email=request.email, password=request.password)
        )
        
        return token
        
    except ValueError as e:
        logger.warning(f"Registration error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to register user"
        )


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """
    Login user and return access token.
    
    Args:
        request: Login request with email and password
        db: Database session
        http_request: HTTP request for IP extraction
        
    Returns:
        TokenResponse with access token and user info
    """
    try:
        # Get client IP
        ip_address = None
        if http_request:
            ip_address = http_request.client.host if http_request.client else None
        
        # Authenticate user
        token_response = AuthService.login(db, request, ip_address)
        return token_response
        
    except ValueError as e:
        logger.warning(f"Login error: {e}")
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )


@router.post("/logout")
def logout(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """
    Logout user and log the activity.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        http_request: HTTP request
        
    Returns:
        Success message
    """
    try:
        ip_address = None
        if http_request:
            ip_address = http_request.client.host if http_request.client else None
        
        AuthService.logout(db, current_user["user_id"], ip_address)
        
        return {
            "status": "success",
            "message": "Logged out successfully"
        }
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Logout failed"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        UserResponse with user info
    """
    try:
        return AuthService.get_user_by_id(db, current_user["user_id"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user information"
        )


@router.post("/refresh")
def refresh_token(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh access token for a user.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        TokenResponse with new access token
    """
    try:
        from app.security import create_access_token
        
        token = create_access_token(
            user_id=current_user["user_id"],
            username=current_user["username"],
            email=current_user["email"],
            role=current_user["role"]
        )
        
        # Get user for response
        user = AuthService.get_user_by_id(db, current_user["user_id"])
        
        return {
            "access_token": token.access_token,
            "token_type": token.token_type,
            "expires_in": token.expires_in,
            "user": user
        }
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh token"
        )
