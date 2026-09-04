"""
Pydantic Schemas
Defines request/response schemas for API validation and documentation.
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime


# ============================================================================
# AUTHENTICATION SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    """Request model for login endpoint."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")


class RegisterRequest(BaseModel):
    """Request model for registration endpoint."""
    full_name: str = Field(..., min_length=2, max_length=255)
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    
    
class UserResponse(BaseModel):
    """User information response."""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class LogoutRequest(BaseModel):
    """Request model for logout."""
    pass


# ============================================================================
# QUERY & ANALYSIS SCHEMAS
# ============================================================================

class QueryRequest(BaseModel):
    """Request model for the /api/query endpoint."""

    question: str = Field(
        ...,
        description="Natural language business question",
        example="Which region has the highest profit?",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"question": "What is our total revenue by region?"}
        }
    )


class SQLGenerateRequest(BaseModel):
    """Request model for generating a validated semantic-layer query."""

    metrics: List[str] = Field(..., min_length=1)
    dimensions: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)
    order_by: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=100000)


class SQLGenerateResponse(BaseModel):
    sql: str
    valid: bool


class SQLValidateRequest(BaseModel):
    sql: str = Field(..., min_length=1, max_length=5000)


class SQLValidateResponse(BaseModel):
    valid: bool
    error: Optional[str] = None


class DataLoadRequest(BaseModel):
    file_path: Optional[str] = None
    overwrite: bool = False


class DataLoadResponse(BaseModel):
    status: str
    loaded: int
    existing: int


class AgentIntentRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: List[str] = Field(default_factory=list)
    dimensions: List[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    insights: List[str]
    quality: Dict[str, Any]


class ChartConfig(BaseModel):
    """Configuration for chart rendering on the frontend."""

    type: str = Field(
        ...,
        description="Chart type (bar, line, pie, table, etc.)",
        example="bar",
    )
    x: Optional[str] = Field(
        None, description="X-axis column", example="region"
    )
    y: Optional[str] = Field(
        None, description="Y-axis column", example="profit"
    )
    group_by: Optional[str] = Field(
        None, description="Grouping column for multi-series"
    )


class MetricInfo(BaseModel):
    """Information about an available metric."""

    name: str
    display_name: str
    description: str
    sql_expression: str


class DimensionInfo(BaseModel):
    """Information about an available dimension."""

    name: str
    display_name: str
    description: str
    column_name: str


class QueryResponse(BaseModel):
    """Response model for the /api/query endpoint."""

    question: str = Field(
        ..., description="The original question asked"
    )
    answer: str = Field(
        ..., description="Natural language answer to the question"
    )
    sql: str = Field(
        ..., description="Generated SQL query for transparency"
    )
    metrics_used: List[str] = Field(
        ..., description="List of metrics referenced in the query"
    )
    dimensions_used: List[str] = Field(
        ..., description="List of dimensions used (filters/grouping)"
    )
    data: List[Dict[str, Any]] = Field(
        ..., description="Tabular query results"
    )
    chart: ChartConfig = Field(
        ..., description="Suggested chart configuration"
    )
    execution_time_ms: float = Field(
        ..., description="Query execution time in milliseconds"
    )
    row_count: int = Field(..., description="Number of rows in results")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "question": "Which region has the highest profit?",
                "answer": "The West region has the highest profit with $108,418.45.",
                "sql": "SELECT region, SUM(profit) as profit FROM sales GROUP BY region ORDER BY profit DESC LIMIT 10",
                "metrics_used": ["profit"],
                "dimensions_used": ["region"],
                "data": [
                    {"region": "West", "profit": 108418.45},
                    {"region": "East", "profit": 91522.78},
                ],
                "chart": {
                    "type": "bar",
                    "x": "region",
                    "y": "profit",
                },
                "execution_time_ms": 45.3,
                "row_count": 4,
            }
        }
    )


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str = Field(..., example="healthy")
    message: str = Field(..., example="MetricMind backend is running")


class MetricsListResponse(BaseModel):
    """Response model for listing available metrics."""

    metrics: List[MetricInfo]
    count: int = Field(..., description="Number of available metrics")


class DimensionsListResponse(BaseModel):
    """Response model for listing available dimensions."""

    dimensions: List[DimensionInfo]
    count: int = Field(..., description="Number of available dimensions")


class ErrorResponse(BaseModel):
    """Response model for error cases."""

    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional details")
    code: Optional[str] = Field(None, description="Error code")


# ============================================================================
# DATA MANAGEMENT SCHEMAS
# ============================================================================

class SalesRecordResponse(BaseModel):
    """Sales record response."""
    row_id: int
    order_id: str
    order_date: str
    customer_id: str
    customer_name: Optional[str]
    region: str
    category: str
    sub_category: Optional[str]
    product_name: Optional[str]
    sales: float
    quantity: int
    profit: float
    discount: Optional[float]
    segment: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)


class SalesRecordCreateRequest(BaseModel):
    """Request to create a sales record."""
    order_id: str
    order_date: str
    customer_id: str
    customer_name: str
    region: str
    category: str
    sub_category: Optional[str]
    product_name: str
    sales: float
    quantity: int
    profit: float
    discount: Optional[float] = 0.0
    segment: Optional[str]


class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    data: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int


class DashboardKPIsResponse(BaseModel):
    """Dashboard KPI response."""
    total_sales: float
    total_profit: float
    total_orders: int
    total_customers: int
    total_quantity: int
    average_order_value: float
    profit_margin: float
    currency: str = "USD"


class LoginActivityResponse(BaseModel):
    """Login activity record."""
    id: int
    user_id: int
    action: str
    login_time: datetime
    logout_time: Optional[datetime]
    ip_address: Optional[str]
    status: str
    
    model_config = ConfigDict(from_attributes=True)


class QueryHistoryResponse(BaseModel):
    """Query history record."""
    id: int
    user_id: int
    question: str
    metrics: Optional[str]
    dimensions: Optional[str]
    sql_query: Optional[str]
    result_rows: int
    execution_time_ms: float
    status: str
    error_message: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
