"""
Database Configuration and Connection
Handles SQLAlchemy setup, session management, and database initialization.
"""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import logging

from app.models import Base

logger = logging.getLogger(__name__)

# Get database URL from environment, default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./metricmind.db")

# SQLite-specific engine configuration
if DATABASE_URL.startswith("sqlite"):
    # Use StaticPool to keep connection open for SQLite in-memory databases
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool if ":memory:" in DATABASE_URL else None,
    )

    # Enable foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL or other databases
    engine = create_engine(DATABASE_URL, echo=False)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dependency for getting a database session.
    Used by FastAPI to inject session into route handlers.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize the database by creating all tables.
    Call this once when the application starts.
    """
    logger.info(f"Initializing database: {DATABASE_URL}")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def drop_db():
    """
    Drop all tables. Use with caution!
    Useful for testing and development.
    """
    logger.warning("Dropping all database tables")
    Base.metadata.drop_all(bind=engine)
