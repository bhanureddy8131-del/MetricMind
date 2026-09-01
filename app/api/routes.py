"""
API Routes
FastAPI routes for the MetricMind API.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    QueryRequest, QueryResponse, HealthResponse,
    MetricsListResponse, MetricInfo,
    DimensionsListResponse, DimensionInfo
)
from app.semantic_layer.loader import semantic_layer
from app.services.query_service import QueryService

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
