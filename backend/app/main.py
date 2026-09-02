"""Main application entrypoint for the MetricMind backend."""
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import routes
from app.database import init_db

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MetricMind",
    description="AI-powered Semantic Business Intelligence API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting MetricMind API")
    init_db()


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    logger.error("Value error: %s", exc)
    return JSONResponse(status_code=400, content={"error": str(exc)})


@app.get("/")
async def root():
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