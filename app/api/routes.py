"""
API Routes
FastAPI routes for the MetricMind API.
"""
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.schemas import (
    QueryRequest, QueryResponse, HealthResponse,
    MetricsListResponse, MetricInfo,
    DimensionsListResponse, DimensionInfo, SQLGenerateRequest,
    SQLGenerateResponse, SQLValidateRequest, SQLValidateResponse,
    AgentIntentRequest, AnalysisRequest, AnalysisResponse,
    DataLoadRequest, DataLoadResponse
)
from app.semantic_layer.loader import semantic_layer
from app.services.query_service import QueryService
from app.services.analysis_service import AnalysisService
from app.agent.agent import get_agent
from app.agent.tools import AgentTools
from app.sql.generator import SQLGenerator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "MetricMind backend is running"
    }


@router.get("/metrics", response_model=MetricsListResponse)
def list_metrics():
    """
    Get all available metrics.
    
    Returns a list of all metrics defined in the semantic layer.
    Each metric includes name, display name, and description.
    """
    try:
        metrics = semantic_layer.list_metrics()
        metrics_info = [
            MetricInfo(
                name=m["name"],
                display_name=m.get("display_name", m["name"]),
                description=m.get("description", ""),
                sql_expression=m.get("sql_expression", ""),
            )
            for m in metrics
        ]
        return {"metrics": metrics_info, "count": len(metrics_info)}
    except Exception as e:
        logger.error(f"Error listing metrics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving metrics")


@router.get("/dimensions", response_model=DimensionsListResponse)
def list_dimensions():
    """
    Get all available dimensions.
    
    Returns a list of all dimensions defined in the semantic layer.
    Each dimension includes name, display name, and description.
    """
    try:
        dimensions = semantic_layer.list_dimensions()
        dimensions_info = [
            DimensionInfo(
                name=d["name"],
                display_name=d.get("display_name", d["name"]),
                description=d.get("description", ""),
                column_name=d.get("column_name", ""),
            )
            for d in dimensions
        ]
        return {"dimensions": dimensions_info, "count": len(dimensions_info)}
    except Exception as e:
        logger.error(f"Error listing dimensions: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving dimensions")


@router.get("/status")
def backend_status(db: Session = Depends(get_db)):
    """Return API and database readiness without exposing connection details."""
    try:
        db.execute(text("SELECT 1"))
        record_count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar_one()
        return {"status": "ready", "database": "connected", "record_count": record_count}
    except Exception as exc:
        logger.error("Database status check failed: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.post("/data/load", response_model=DataLoadResponse)
def load_data(request: DataLoadRequest, db: Session = Depends(get_db)):
    """Load a repository CSV into SQLite, optionally replacing existing data."""
    from scripts.load_data import load_csv_data

    repository_root = Path(__file__).resolve().parents[2]
    allowed_roots = [(repository_root / name).resolve() for name in ("data", "Dataset")]
    file_path = Path(request.file_path or "data/MetricMind_Superstore_Sample.csv").resolve()
    if file_path.suffix.lower() != ".csv" or not any(
        file_path.is_relative_to(root) for root in allowed_roots
    ):
        raise HTTPException(status_code=400, detail="file_path must reference a CSV in data or Dataset")
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="CSV file not found")

    result = load_csv_data(str(file_path), db=db, overwrite=request.overwrite)
    if result["status"] == "already_loaded":
        raise HTTPException(status_code=409, detail="Database already contains data; set overwrite=true")
    return result


@router.post("/sql/generate", response_model=SQLGenerateResponse)
def generate_sql(request: SQLGenerateRequest):
    """Generate SQL from semantic-layer names and validate it before returning it."""
    try:
        invalid_metrics = [m for m in request.metrics if not semantic_layer.validate_metric(m)]
        invalid_dimensions = [d for d in request.dimensions if not semantic_layer.validate_dimension(d)]
        invalid_filters = [
            name for name in request.filters if not semantic_layer.validate_dimension(name)
        ]
        valid_order_by = set(request.metrics) | set(request.dimensions)
        if request.order_by and request.order_by not in valid_order_by:
            invalid_order_by = request.order_by
        else:
            invalid_order_by = None
        if invalid_metrics or invalid_dimensions or invalid_filters or invalid_order_by:
            raise HTTPException(
                status_code=422,
                detail={
                    "invalid_metrics": invalid_metrics,
                    "invalid_dimensions": invalid_dimensions,
                    "invalid_filters": invalid_filters,
                    "invalid_order_by": invalid_order_by,
                },
            )
        sql = SQLGenerator.build_query(
            request.metrics,
            request.dimensions,
            request.filters,
            request.order_by,
            request.limit,
            semantic_layer,
        )
        valid, error, _ = SQLGenerator.validate_and_prepare_query(sql)
        if not valid:
            raise HTTPException(status_code=422, detail=error)
        return {"sql": sql, "valid": True}
    except HTTPException:
        raise
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/sql/validate", response_model=SQLValidateResponse)
def validate_sql(request: SQLValidateRequest):
    """Validate a read-only SQL statement without executing it."""
    valid, error, _ = SQLGenerator.validate_and_prepare_query(request.sql)
    return {"valid": valid, "error": error}


@router.post("/agent/intent")
def parse_agent_intent(request: AgentIntentRequest):
    """Expose the agent's parsed intent for diagnostics and integrations."""
    return get_agent().parse_question(request.question)


@router.post("/analysis", response_model=AnalysisResponse)
def analyze_results(request: AnalysisRequest):
    """Generate business insights and data-quality information for query results."""
    return {
        "insights": AnalysisService.generate_insights(
            request.data, request.metrics, request.dimensions
        ),
        "quality": AnalysisService.validate_data_quality(request.data),
    }


@router.get("/agent/tools")
def list_agent_tools():
    """Return the supported agent tool names."""
    return {
        "tools": [
            "lookup_semantic_layer",
            "validate_metric",
            "validate_dimension",
            "extract_query_intent",
            "suggest_similar_metrics",
        ]
    }


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Process a natural language business question.
    
    Accepts a natural language question and returns:
    - Natural language answer
    - Generated SQL query
    - Metrics and dimensions used
    - Tabular data results
    - Suggested chart configuration
    
    Example question: "Which region has the highest profit?"
    """
    try:
        question = request.question.strip()

        if not question:
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        if len(question) > 1000:
            raise HTTPException(status_code=400, detail="Question is too long (max 1000 characters)")

        logger.info(f"Processing query: {question}")

        # Process the question
        result = QueryService.process_question(question, db)

        # Check if there was an error
        if "error" in result:
            error_detail = result.get("details", result["error"])
            logger.warning(f"Query failed: {error_detail}")
            raise HTTPException(status_code=400, detail=error_detail)

        # Map to response model
        response = QueryResponse(
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

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
