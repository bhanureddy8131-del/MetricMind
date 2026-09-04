"""
Data Management Routes
Endpoints for CRUD operations on sales data and analytics.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, text
from datetime import datetime, date as date_type

from app.database import get_db
from app.models import SalesRecord
from app.schemas import (
    SalesRecordResponse, SalesRecordCreateRequest, PaginatedResponse,
    DashboardKPIsResponse
)
from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/data", tags=["data"])


@router.get("/", response_model=PaginatedResponse)
def get_sales_data(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=1000),
    search: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: Optional[str] = "order_date",
    sort_order: Optional[str] = "desc",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get paginated sales data with optional filtering and search.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of records per page
        search: Search term (searches customer name, product name, order ID)
        region: Filter by region
        category: Filter by category
        sort_by: Field to sort by
        sort_order: Sort direction (asc or desc)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        PaginatedResponse with sales data
    """
    try:
        query = db.query(SalesRecord)
        
        # Apply filters
        if search:
            query = query.filter(
                (SalesRecord.customer_name.ilike(f"%{search}%")) |
                (SalesRecord.product_name.ilike(f"%{search}%")) |
                (SalesRecord.order_id.ilike(f"%{search}%"))
            )
        
        if region:
            query = query.filter(SalesRecord.region == region)
        
        if category:
            query = query.filter(SalesRecord.category == category)
        
        # Get total count
        total = query.count()
        
        # Sort
        if sort_by in ["order_date", "sales", "profit", "customer_name"]:
            sort_column = getattr(SalesRecord, sort_by)
            if sort_order.lower() == "asc":
                query = query.order_by(sort_column.asc())
            else:
                query = query.order_by(sort_column.desc())
        
        # Paginate
        skip = (page - 1) * page_size
        records = query.skip(skip).limit(page_size).all()
        
        # Convert to list of dicts
        data = [
            {
                "row_id": r.row_id,
                "order_id": r.order_id,
                "order_date": r.order_date.isoformat() if r.order_date else None,
                "customer_id": r.customer_id,
                "customer_name": r.customer_name,
                "region": r.region,
                "category": r.category,
                "sub_category": r.sub_category,
                "product_name": r.product_name,
                "sales": r.sales,
                "quantity": r.quantity,
                "profit": r.profit,
                "discount": r.discount,
                "segment": r.segment,
            }
            for r in records
        ]
        
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
        
    except Exception as e:
        logger.error(f"Error fetching sales data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch data")


@router.post("/", response_model=dict)
def create_sales_record(
    record: SalesRecordCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new sales record.
    
    Args:
        record: Sales record data
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created record with ID
    """
    try:
        # Parse order date
        order_date = datetime.fromisoformat(record.order_date).date()
        
        new_record = SalesRecord(
            order_id=record.order_id,
            order_date=order_date,
            customer_id=record.customer_id,
            customer_name=record.customer_name,
            region=record.region,
            category=record.category,
            sub_category=record.sub_category,
            product_name=record.product_name,
            sales=record.sales,
            quantity=record.quantity,
            profit=record.profit,
            discount=record.discount or 0.0,
            segment=record.segment,
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        logger.info(f"Created sales record: {new_record.row_id}")
        
        return {
            "status": "success",
            "row_id": new_record.row_id,
            "message": "Record created successfully"
        }
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid data: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create record")


@router.put("/{row_id}", response_model=dict)
def update_sales_record(
    row_id: int,
    record: SalesRecordCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing sales record.
    
    Args:
        row_id: Record ID
        record: Updated record data
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Updated record
    """
    try:
        db_record = db.query(SalesRecord).filter(SalesRecord.row_id == row_id).first()
        
        if not db_record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Update fields
        order_date = datetime.fromisoformat(record.order_date).date()
        db_record.order_id = record.order_id
        db_record.order_date = order_date
        db_record.customer_id = record.customer_id
        db_record.customer_name = record.customer_name
        db_record.region = record.region
        db_record.category = record.category
        db_record.sub_category = record.sub_category
        db_record.product_name = record.product_name
        db_record.sales = record.sales
        db_record.quantity = record.quantity
        db_record.profit = record.profit
        db_record.discount = record.discount or 0.0
        db_record.segment = record.segment
        
        db.commit()
        db.refresh(db_record)
        
        logger.info(f"Updated sales record: {row_id}")
        
        return {
            "status": "success",
            "row_id": db_record.row_id,
            "message": "Record updated successfully"
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid data: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating record: {e}")
        raise HTTPException(status_code=500, detail="Failed to update record")


@router.delete("/{row_id}", response_model=dict)
def delete_sales_record(
    row_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a sales record.
    
    Args:
        row_id: Record ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Success message
    """
    try:
        record = db.query(SalesRecord).filter(SalesRecord.row_id == row_id).first()
        
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        db.delete(record)
        db.commit()
        
        logger.info(f"Deleted sales record: {row_id}")
        
        return {
            "status": "success",
            "message": "Record deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting record: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete record")
