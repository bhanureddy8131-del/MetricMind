"""
Authentication Service
Handles user registration, login, and authentication logic.
"""

import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import User, LoginActivity
from app.security import hash_password, verify_password, create_access_token, Token
from app.schemas import RegisterRequest, LoginRequest, UserResponse, TokenResponse

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    def register(db: Session, request: RegisterRequest) -> UserResponse:
        """
        Register a new user.
        
        Args:
            db: Database session
            request: Registration request
            
        Returns:
            UserResponse with new user data
            
        Raises:
            ValueError: If user already exists or registration fails
        """
        # Check if user or email already exists
        existing_user = db.query(User).filter(
            (User.email == request.email) | (User.username == request.username)
        ).first()
        
        if existing_user:
            raise ValueError("Email or username already registered")
        
        try:
            # Create new user
            user = User(
                username=request.username,
                email=request.email,
                full_name=request.full_name,
                password_hash=hash_password(request.password),
                role="user",
                is_active=True
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"User registered: {user.username}")
            return UserResponse.model_validate(user)
            
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Registration error: {e}")
            raise ValueError("Failed to register user")
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected registration error: {e}")
            raise

    @staticmethod
    def login(db: Session, request: LoginRequest, ip_address: str = None) -> TokenResponse:
        """
        Authenticate a user and return a token.
        
        Args:
            db: Database session
            request: Login request
            ip_address: Client IP address for audit trail
            
        Returns:
            TokenResponse with access token and user info
            
        Raises:
            ValueError: If credentials are invalid
        """
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user or not verify_password(request.password, user.password_hash):
            # Log failed attempt
            AuthService._log_login_activity(
                db, None, "login", "failed", ip_address
            )
            raise ValueError("Invalid email or password")
        
        if not user.is_active:
            raise ValueError("User account is inactive")
        
        # Log successful login
        AuthService._log_login_activity(
            db, user.id, "login", "success", ip_address
        )
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create token
        token = create_access_token(
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=user.role
        )
        
        logger.info(f"User logged in: {user.username}")
        
        return TokenResponse(
            access_token=token.access_token,
            token_type=token.token_type,
            expires_in=token.expires_in,
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    def logout(db: Session, user_id: int, ip_address: str = None) -> bool:
        """
        Log user logout activity.
        
        Args:
            db: Database session
            user_id: User ID
            ip_address: Client IP address
            
        Returns:
            True if logout was logged successfully
        """
        try:
            AuthService._log_login_activity(
                db, user_id, "logout", "success", ip_address
            )
            logger.info(f"User logged out: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error logging logout: {e}")
            return False

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> UserResponse:
        """
        Get user information by ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            UserResponse
            
        Raises:
            ValueError: If user not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise ValueError("User not found")
        
        return UserResponse.model_validate(user)

    @staticmethod
    def _log_login_activity(
        db: Session,
        user_id: int = None,
        action: str = "login",
        status: str = "success",
        ip_address: str = None
    ) -> None:
        """
        Log login/logout activity.
        
        Args:
            db: Database session
            user_id: User ID (can be None for failed attempts)
            action: Action type (login, logout)
            status: Status (success, failed)
            ip_address: Client IP address
        """
        try:
            activity = LoginActivity(
                user_id=user_id,
                action=action,
                login_time=datetime.utcnow(),
                ip_address=ip_address,
                status=status
            )
            db.add(activity)
            db.commit()
        except Exception as e:
            logger.error(f"Error logging activity: {e}")
            db.rollback()
