"""
Security module for JWT token management and password hashing.
Handles authentication tokens, password encryption, and token validation.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenData(BaseModel):
    """Token payload data."""
    user_id: int
    username: str
    email: str
    role: str


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.
    
    Args:
        plain_password: Plain text password to check
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: int,
    username: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> Token:
    """
    Create a JWT access token.
    
    Args:
        user_id: User ID
        username: Username
        email: User email
        role: User role
        expires_delta: Custom expiration time
        
    Returns:
        Token object with access_token and expiration info
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    
    payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "role": role,
        "iat": now.timestamp(),
        "exp": expire.timestamp(),
    }
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return Token(
        access_token=encoded_jwt,
        token_type="bearer",
        expires_in=int(expires_delta.total_seconds())
    )


def decode_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenData(
            user_id=payload.get("user_id"),
            username=payload.get("username"),
            email=payload.get("email"),
            role=payload.get("role")
        )
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_header(auth_header: Optional[str]) -> Optional[str]:
    """
    Extract JWT token from Authorization header.
    
    Args:
        auth_header: Authorization header value
        
    Returns:
        Token string or None
    """
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]
