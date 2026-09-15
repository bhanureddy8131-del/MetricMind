"""
API Routes
FastAPI routes for MetricMind.
"""

import logging
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    QueryRequest,
    QueryResponse,
    HealthResponse,
    MetricsListResponse,
    MetricInfo,
    DimensionsListResponse,
    DimensionInfo,
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    MeResponse,
)
from app.semantic_layer.loader import semantic_layer
from app.services.query_service import QueryService


logger = logging.getLogger(__name__)


# ============================================================
# MAIN ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["api"],
)


# ============================================================
# AUTH ROUTER
# ============================================================

auth_router = APIRouter(
    prefix="/v1/auth",
    tags=["authentication"],
)


# ============================================================
# JWT SETTINGS
# ============================================================

SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "metricmind-development-secret-change-this",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


security = HTTPBearer(auto_error=False)


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str) -> str:
    """Create bcrypt password hash."""

    password_bytes = password.encode("utf-8")

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt(),
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """Verify password."""

    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ============================================================
# JWT TOKEN
# ============================================================

def create_access_token(user_id: int) -> str:
    """Create JWT access token."""

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token


# ============================================================
# USER RESPONSE
# ============================================================

def user_to_response(user: User) -> dict:
    """Convert User database object to API response."""

    return {
        "id": user.id,
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
    }


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    """
    Get logged-in user from JWT token.
    """

    # --------------------------------------------------------
    # Check Authorization header
    # --------------------------------------------------------

    if credentials is None:
        logger.warning(
            "Authentication failed: Authorization header missing"
        )

        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    # --------------------------------------------------------
    # Get token
    # --------------------------------------------------------

    token = credentials.credentials

    if not token:
        logger.warning(
            "Authentication failed: empty token"
        )

        raise HTTPException(
            status_code=401,
            detail="Authentication token missing",
        )

    # --------------------------------------------------------
    # Decode JWT
    # --------------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

    except JWTError as exc:
        logger.warning(
            f"Authentication failed: JWT error: {exc}"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )

    # --------------------------------------------------------
    # Get user ID
    # --------------------------------------------------------

    user_id = payload.get("sub")

    if not user_id:
        logger.warning(
            "Authentication failed: JWT has no user ID"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):

        logger.warning(
            "Authentication failed: invalid user ID"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        logger.warning(
            f"Authentication failed: user {user_id} not found"
        )

        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Check active account
    # --------------------------------------------------------

    if not user.is_active:

        logger.warning(
            f"Authentication failed: user {user_id} inactive"
        )

        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    return user


# ============================================================
# HEALTH
# ============================================================

@router.get(
    "/health",
    response_model=HealthResponse,
)
def health_check():

    return {
        "status": "healthy",
        "message": "MetricMind backend is running",
    }


# ============================================================
# METRICS
# ============================================================

@router.get(
    "/metrics",
    response_model=MetricsListResponse,
)
def list_metrics():

    try:

        metrics = semantic_layer.list_metrics()

        metrics_info = [
            MetricInfo(
                name=m["name"],
                display_name=m.get(
                    "display_name",
                    m["name"],
                ),
                description=m.get(
                    "description",
                    "",
                ),
                sql_expression=m.get(
                    "sql_expression",
                    "",
                ),
            )
            for m in metrics
        ]

        return {
            "metrics": metrics_info,
            "count": len(metrics_info),
        }

    except Exception as e:

        logger.error(
            f"Error listing metrics: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Error retrieving metrics",
        )


# ============================================================
# DIMENSIONS
# ============================================================

@router.get(
    "/dimensions",
    response_model=DimensionsListResponse,
)
def list_dimensions():

    try:

        dimensions = semantic_layer.list_dimensions()

        dimensions_info = [
            DimensionInfo(
                name=d["name"],
                display_name=d.get(
                    "display_name",
                    d["name"],
                ),
                description=d.get(
                    "description",
                    "",
                ),
                column_name=d.get(
                    "column_name",
                    "",
                ),
            )
            for d in dimensions
        ]

        return {
            "dimensions": dimensions_info,
            "count": len(dimensions_info),
        }

    except Exception as e:

        logger.error(
            f"Error listing dimensions: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Error retrieving dimensions",
        )


# ============================================================
# NATURAL LANGUAGE QUERY
# ============================================================

@router.post(
    "/query",
    response_model=QueryResponse,
)
def query(
    request: QueryRequest,
    db: Session = Depends(get_db),
):

    try:

        question = request.question.strip()

        if not question:

            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty",
            )

        if len(question) > 1000:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Question is too long "
                    "(max 1000 characters)"
                ),
            )

        logger.info(
            f"Processing query: {question}"
        )

        result = QueryService.process_question(
            question,
            db,
        )

        if "error" in result:

            error_detail = result.get(
                "details",
                result["error"],
            )

            raise HTTPException(
                status_code=400,
                detail=error_detail,
            )

        return QueryResponse(
            question=result["question"],
            answer=result["answer"],
            sql=result["sql"],
            metrics_used=result["metrics_used"],
            dimensions_used=result["dimensions_used"],
            data=result["data"],
            chart=result["chart"],
            execution_time_ms=result["execution_time_ms"],
            row_count=result["row_count"],
        )

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Error processing query: {e}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Internal server error",
        )


# ============================================================
# REGISTER
# ============================================================

@auth_router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    full_name = request.full_name.strip()

    username = (
        request.username
        .strip()
        .lower()
    )

    email = (
        request.email
        .strip()
        .lower()
    )

    if len(full_name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Full name is too short",
        )

    existing_email = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    existing_username = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )

    new_user = User(
        full_name=full_name,
        username=username,
        email=email,
        hashed_password=hash_password(
            request.password
        ),
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        new_user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_to_response(
            new_user
        ),
    }


# ============================================================
# LOGIN
# ============================================================

@auth_router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    email = (
        request.email
        .strip()
        .lower()
    )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        request.password,
        user.hashed_password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        user.id
    )

    logger.info(
        f"User logged in successfully: {user.email}"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_to_response(user),
    }


# ============================================================
# CURRENT USER
# ============================================================

@auth_router.get(
    "/me",
    response_model=MeResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):

    return {
        "user": user_to_response(
            current_user
        )
    }


# ============================================================
# LOGOUT
# ============================================================

@auth_router.post("/logout")
def logout():

    return {
        "message": "Logged out successfully"
    }


# ============================================================
# ADD AUTH ROUTES
# ============================================================

router.include_router(auth_router)


# ============================================================
# DATASET ROUTES
# ============================================================

from app.api.datasets import router as dataset_router

router.include_router(dataset_router)