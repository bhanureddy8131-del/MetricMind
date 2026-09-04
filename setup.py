#!/usr/bin/env python
"""
MetricMind Setup Script
Initializes the application with demo data and users.
"""

import os
import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_db, SessionLocal
from app.models import User
from app.security import hash_password
from scripts.load_data import load_csv_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_demo_users(db):
    """Create demo user accounts."""
    logger.info("Creating demo users...")

    demo_users = [
        {
            "username": "demo",
            "email": "demo@metricmind.com",
            "full_name": "Demo User",
            "password": "demo1234",
            "role": "user"
        },
        {
            "username": "admin",
            "email": "admin@metricmind.com",
            "full_name": "Admin User",
            "password": "admin1234",
            "role": "admin"
        },
        {
            "username": "analyst",
            "email": "analyst@metricmind.com",
            "full_name": "Data Analyst",
            "password": "analyst1234",
            "role": "user"
        }
    ]

    for user_data in demo_users:
        # Check if user exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            logger.info(f"User already exists: {user_data['email']}")
            continue

        user = User(
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
        logger.info(f"Created user: {user_data['email']}")

    db.commit()


def setup():
    """Run the setup process."""
    try:
        logger.info("=" * 60)
        logger.info("MetricMind Setup Starting")
        logger.info("=" * 60)

        # Initialize database
        logger.info("Initializing database...")
        init_db()
        logger.info("✓ Database initialized")

        # Create demo users
        db = SessionLocal()
        try:
            create_demo_users(db)
            logger.info("✓ Demo users created")
        finally:
            db.close()

        # Load demo data
        logger.info("Loading demo data...")
        data_file = "data/MetricMind_Superstore_Sample.csv"
        if not os.path.exists(data_file):
            data_file = "Dataset/MetricMind_Superstore_Cleaned.csv"

        if os.path.exists(data_file):
            result = load_csv_data(data_file, db=None, overwrite=False)
            logger.info(f"✓ Data loaded: {result.get('loaded', 0)} rows")
        else:
            logger.warning(f"Data file not found: {data_file}")

        logger.info("=" * 60)
        logger.info("MetricMind Setup Complete!")
        logger.info("=" * 60)
        logger.info("")
        logger.info("Demo Credentials:")
        logger.info("  Email: demo@metricmind.com")
        logger.info("  Password: demo1234")
        logger.info("")
        logger.info("Backend: http://127.0.0.1:8000")
        logger.info("Frontend: http://127.0.0.1:5173")
        logger.info("")

    except Exception as e:
        logger.error(f"Setup failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    setup()
