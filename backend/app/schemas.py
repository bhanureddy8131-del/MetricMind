"""
Pydantic Schemas
Defines request and response schemas
for the MetricMind API.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ============================================================
# QUERY SCHEMAS
# ============================================================

class QueryRequest(BaseModel):
    """Request model for the /api/query endpoint."""

    question: str = Field(
        ...,
        description="Natural language business question",
        example="Which region has the highest profit?",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is our total revenue by region?"
            }
        }


class ChartConfig(BaseModel):
    """Configuration for chart rendering."""

    type: str = Field(
        ...,
        description="Chart type",
        example="bar",
    )

    x: Optional[str] = Field(
        None,
        description="X-axis column",
        example="region",
    )

    y: Optional[str] = Field(
        None,
        description="Y-axis column",
        example="profit",
    )

    group_by: Optional[str] = Field(
        None,
        description="Grouping column for multi-series",
    )


class QueryResponse(BaseModel):
    """Response model for the /api/query endpoint."""

    question: str = Field(
        ...,
        description="Original question"
    )

    answer: str = Field(
        ...,
        description="Natural language answer"
    )

    sql: str = Field(
        ...,
        description="Generated SQL query"
    )

    metrics_used: List[str] = Field(
        ...,
        description="Metrics used"
    )

    dimensions_used: List[str] = Field(
        ...,
        description="Dimensions used"
    )

    data: List[Dict[str, Any]] = Field(
        ...,
        description="Query results"
    )

    chart: ChartConfig = Field(
        ...,
        description="Suggested chart"
    )

    execution_time_ms: float = Field(
        ...,
        description="Execution time"
    )

    row_count: int = Field(
        ...,
        description="Number of rows"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Which region has the highest profit?",
                "answer": (
                    "The West region has the highest profit."
                ),
                "sql": (
                    "SELECT region, SUM(profit) "
                    "FROM sales GROUP BY region"
                ),
                "metrics_used": ["profit"],
                "dimensions_used": ["region"],
                "data": [
                    {
                        "region": "West",
                        "profit": 108418.45
                    }
                ],
                "chart": {
                    "type": "bar",
                    "x": "region",
                    "y": "profit"
                },
                "execution_time_ms": 45.3,
                "row_count": 4,
            }
        }


# ============================================================
# METRIC SCHEMAS
# ============================================================

class MetricInfo(BaseModel):
    """Information about an available metric."""

    name: str
    display_name: str
    description: str
    sql_expression: str


class MetricsListResponse(BaseModel):
    """Response containing available metrics."""

    metrics: List[MetricInfo]

    count: int = Field(
        ...,
        description="Number of metrics"
    )


# ============================================================
# DIMENSION SCHEMAS
# ============================================================

class DimensionInfo(BaseModel):
    """Information about an available dimension."""

    name: str
    display_name: str
    description: str
    column_name: str


class DimensionsListResponse(BaseModel):
    """Response containing available dimensions."""

    dimensions: List[DimensionInfo]

    count: int = Field(
        ...,
        description="Number of dimensions"
    )


# ============================================================
# HEALTH SCHEMA
# ============================================================

class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(
        ...,
        example="healthy"
    )

    message: str = Field(
        ...,
        example="MetricMind backend is running"
    )


# ============================================================
# ERROR SCHEMA
# ============================================================

class ErrorResponse(BaseModel):
    """Error response."""

    error: str = Field(
        ...,
        description="Error message"
    )

    details: Optional[str] = Field(
        None,
        description="Additional details"
    )

    code: Optional[str] = Field(
        None,
        description="Error code"
    )


# ============================================================
# AUTHENTICATION SCHEMAS
# ============================================================

class RegisterRequest(BaseModel):
    """Request for creating a new user."""

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=255
    )

    username: str = Field(
        ...,
        min_length=3,
        max_length=100
    )

    email: str = Field(
        ...,
        min_length=5,
        max_length=255
    )

    password: str = Field(
        ...,
        min_length=6,
        max_length=72
    )


class LoginRequest(BaseModel):
    """Request for user login."""

    email: str = Field(
        ...,
        min_length=5
    )

    password: str = Field(
        ...,
        min_length=1
    )


class UserResponse(BaseModel):
    """Public user information."""

    id: int
    full_name: str
    username: str
    email: str
    is_active: bool


class TokenResponse(BaseModel):
    """Login/register response."""

    access_token: str
    token_type: str
    user: UserResponse


class MeResponse(BaseModel):
    """Current user response."""

    user: UserResponse