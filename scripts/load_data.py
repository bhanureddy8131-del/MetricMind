"""
Data Loading Script
Loads the Superstore CSV data into the database.

Usage:
    python scripts/load_data.py --file data/MetricMind_Superstore_Cleaned.csv
"""
import os
import sys
import argparse
import logging
from pathlib import Path
import pandas as pd
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, init_db
from app.models import SalesRecord

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_csv_data(csv_file: str, db=None, overwrite: bool = False):
    """
    Load CSV data into the database.

    Args:
        csv_file: Path to the CSV file
        db: Database session (optional, creates new if not provided)
    """
    if not os.path.exists(csv_file):
        logger.error(f"CSV file not found: {csv_file}")
        return {"status": "not_found", "loaded": 0, "existing": 0}

    logger.info(f"Loading data from: {csv_file}")

    # Read CSV
    existing_count = 0
    try:
        df = pd.read_csv(csv_file)
        logger.info(f"Read {len(df)} rows from CSV")
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return {"status": "read_error", "loaded": 0, "existing": 0}

    # Create database session if not provided
    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        # Check if data already exists
        existing_count = db.query(SalesRecord).count()
        if existing_count > 0:
            logger.info(f"Database already contains {existing_count} records")
            if not overwrite:
                logger.info("Loading cancelled")
                return {"status": "already_loaded", "loaded": 0, "existing": existing_count}
            db.query(SalesRecord).delete()
            db.commit()
            logger.info("Cleared existing data")

        # Prepare data
        records = []
        for idx, row in df.iterrows():
            try:
                # Parse dates
                order_date = pd.to_datetime(row.get("order_date"))
                ship_date = pd.to_datetime(row.get("ship_date")) if pd.notna(row.get("ship_date")) else None

                record = SalesRecord(
                    row_id=int(row.get("row_id", idx + 1)),
                    order_id=str(row.get("order_id", "")),
                    order_date=order_date.date() if order_date else None,
                    ship_date=ship_date.date() if ship_date else None,
                    ship_mode=str(row.get("ship_mode", "")),
                    customer_id=str(row.get("customer_id", "")),
                    customer_name=str(row.get("customer_name", "")),
                    segment=str(row.get("segment", "")),
                    country=str(row.get("country", "")),
                    city=str(row.get("city", "")),
                    state=str(row.get("state", "")),
                    postal_code=str(row.get("postal_code", "")),
                    region=str(row.get("region", "")),
                    product_id=str(row.get("product_id", "")),
                    category=str(row.get("category", "")),
                    sub_category=str(row.get("sub_category", "")),
                    product_name=str(row.get("product_name", "")),
                    sales=float(row.get("sales", 0)),
                    quantity=int(row.get("quantity", 0)) if pd.notna(row.get("quantity")) else 0,
                    discount=float(row.get("discount", 0)) if pd.notna(row.get("discount")) else 0,
                    profit=float(row.get("profit", 0)) if pd.notna(row.get("profit")) else 0,
                )
                records.append(record)
            except Exception as e:
                logger.warning(f"Error processing row {idx}: {e}")
                continue

        # Batch insert
        if records:
            batch_size = 1000
            for i in range(0, len(records), batch_size):
                batch = records[i:i+batch_size]
                db.add_all(batch)
                db.commit()
                logger.info(f"Inserted {min(i+batch_size, len(records))}/{len(records)} records")

            logger.info(f"Successfully loaded {len(records)} records")
            
            # Print summary
            summary = db.query(SalesRecord).limit(5).all()
            logger.info("Sample records:")
            for record in summary:
                logger.info(f"  {record}")
            return {"status": "loaded", "loaded": len(records), "existing": 0}
        else:
            logger.warning("No records to insert")
            return {"status": "empty", "loaded": 0, "existing": 0}

    except Exception as e:
        logger.error(f"Error loading data: {e}")
        db.rollback()
        return {"status": "error", "loaded": 0, "existing": existing_count}
    finally:
        if should_close_db:
            db.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Load CSV data into MetricMind database")
    parser.add_argument(
        "--file",
        type=str,
        default="data/MetricMind_Superstore_Cleaned.csv",
        help="Path to CSV file (default: data/MetricMind_Superstore_Cleaned.csv)",
    )
    parser.add_argument(
        "--init-db",
        action="store_true",
        help="Initialize database before loading",
    )

    args = parser.parse_args()

    # Initialize database if requested
    if args.init_db:
        logger.info("Initializing database...")
        init_db()

    # Load data
    load_csv_data(args.file)
    logger.info("Data loading complete")


if __name__ == "__main__":
    main()
