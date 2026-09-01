"""
Main Application
FastAPI application initialization and configuration.
"""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import init_db
from app.api import routes

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MetricMind",
    description="AI-powered Semantic Business Intelligence API",
    version="1.0.0",
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router)


# Event handlers
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Starting MetricMind API")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down MetricMind API")


# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle ValueError exceptions."""
    logger.error(f"Value error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)},
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "MetricMind",
        "description": "AI-powered Semantic Business Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "GET /api/health",
            "metrics": "GET /api/metrics",
            "dimensions": "GET /api/dimensions",
            "query": "POST /api/query",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
