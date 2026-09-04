"""
Analytics Routes
Endpoints for dashboard KPIs and analytics data.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta

from app.database import get_db
from app.models import SalesRecord
from app.schemas import DashboardKPIsResponse
from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/analytics", tags=["analytics"])


@router.get("/kpis", response_model=DashboardKPIsResponse)
def get_dashboard_kpis(
    region: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get dashboard KPI metrics with optional filtering.
    
    Args:
        region: Filter by region
        category: Filter by category
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        DashboardKPIsResponse with KPI values
    """
    try:
        query = db.query(SalesRecord)
        
        # Apply filters
        if region:
            query = query.filter(SalesRecord.region == region)
        if category:
            query = query.filter(SalesRecord.category == category)
        if start_date:
            try:
                start = datetime.fromisoformat(start_date).date()
                query = query.filter(SalesRecord.order_date >= start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.fromisoformat(end_date).date()
                query = query.filter(SalesRecord.order_date <= end)
            except ValueError:
                pass
        
        # Calculate KPIs
        total_sales = db.session.query(
            func.coalesce(func.sum(SalesRecord.sales), 0.0)
        ).filter(*query.whereclause.clauses if query.whereclause is not None else []).scalar()
        
        total_profit = db.session.query(
            func.coalesce(func.sum(SalesRecord.profit), 0.0)
        ).filter(*query.whereclause.clauses if query.whereclause is not None else []).scalar()
        
        total_orders = db.session.query(
            func.count(func.distinct(SalesRecord.order_id))
        ).filter(*query.whereclause.clauses if query.whereclause is not None else []).scalar()
        
        total_customers = db.session.query(
            func.count(func.distinct(SalesRecord.customer_id))
        ).filter(*query.whereclause.clauses if query.whereclause is not None else []).scalar()
        
        total_quantity = db.session.query(
            func.coalesce(func.sum(SalesRecord.quantity), 0)
        ).filter(*query.whereclause.clauses if query.whereclause is not None else []).scalar()
        
        # Calculate derived metrics
        average_order_value = (
            float(total_sales) / float(total_orders) 
            if total_orders and total_orders > 0 
            else 0.0
        )
        
        profit_margin = (
            float(total_profit) / float(total_sales) * 100
            if total_sales and total_sales > 0
            else 0.0
        )
        
        return {
            "total_sales": float(total_sales or 0),
            "total_profit": float(total_profit or 0),
            "total_orders": int(total_orders or 0),
            "total_customers": int(total_customers or 0),
            "total_quantity": int(total_quantity or 0),
            "average_order_value": round(average_order_value, 2),
            "profit_margin": round(profit_margin, 2),
            "currency": "USD",
        }
        
    except Exception as e:
        logger.error(f"Error fetching KPIs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch KPIs")


@router.get("/sales-by-region")
def get_sales_by_region(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get sales and profit breakdown by region.
    
    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of region data with sales and profit
    """
    try:
        query = db.query(
            SalesRecord.region,
            func.round(func.sum(SalesRecord.sales), 2).label("sales"),
            func.round(func.sum(SalesRecord.profit), 2).label("profit"),
            func.count(func.distinct(SalesRecord.order_id)).label("orders"),
        )
        
        # Apply filters
        if start_date:
            try:
                start = datetime.fromisoformat(start_date).date()
                query = query.filter(SalesRecord.order_date >= start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.fromisoformat(end_date).date()
                query = query.filter(SalesRecord.order_date <= end)
            except ValueError:
                pass
        
        results = query.group_by(SalesRecord.region).all()
        
        return [
            {
                "region": r[0],
                "sales": float(r[1] or 0),
                "profit": float(r[2] or 0),
                "orders": int(r[3] or 0),
            }
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching sales by region: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch regional data")


@router.get("/sales-by-category")
def get_sales_by_category(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get sales and profit breakdown by category.
    
    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of category data with sales and profit
    """
    try:
        query = db.query(
            SalesRecord.category,
            func.round(func.sum(SalesRecord.sales), 2).label("sales"),
            func.round(func.sum(SalesRecord.profit), 2).label("profit"),
            func.count(func.distinct(SalesRecord.order_id)).label("orders"),
        )
        
        # Apply filters
        if start_date:
            try:
                start = datetime.fromisoformat(start_date).date()
                query = query.filter(SalesRecord.order_date >= start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.fromisoformat(end_date).date()
                query = query.filter(SalesRecord.order_date <= end)
            except ValueError:
                pass
        
        results = query.group_by(SalesRecord.category).order_by(
            func.sum(SalesRecord.sales).desc()
        ).all()
        
        return [
            {
                "category": r[0],
                "sales": float(r[1] or 0),
                "profit": float(r[2] or 0),
                "orders": int(r[3] or 0),
            }
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching sales by category: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch category data")


@router.get("/top-products")
def get_top_products(
    limit: int = Query(10, ge=1, le=100),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get top products by sales.
    
    Args:
        limit: Number of top products to return
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of top products
    """
    try:
        query = db.query(
            SalesRecord.product_name,
            SalesRecord.category,
            func.round(func.sum(SalesRecord.sales), 2).label("sales"),
            func.round(func.sum(SalesRecord.profit), 2).label("profit"),
            func.sum(SalesRecord.quantity).label("quantity"),
        )
        
        # Apply filters
        if start_date:
            try:
                start = datetime.fromisoformat(start_date).date()
                query = query.filter(SalesRecord.order_date >= start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.fromisoformat(end_date).date()
                query = query.filter(SalesRecord.order_date <= end)
            except ValueError:
                pass
        
        results = query.group_by(
            SalesRecord.product_name, SalesRecord.category
        ).order_by(
            func.sum(SalesRecord.sales).desc()
        ).limit(limit).all()
        
        return [
            {
                "product": r[0],
                "category": r[1],
                "sales": float(r[2] or 0),
                "profit": float(r[3] or 0),
                "quantity": int(r[4] or 0),
            }
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching top products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product data")


@router.get("/sales-trend")
def get_sales_trend(
    period: str = Query("month", regex="^(day|week|month|quarter|year)$"),
    region: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get sales trend over time.
    
    Args:
        period: Time period (day, week, month, quarter, year)
        region: Filter by region
        category: Filter by category
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of sales data over time
    """
    try:
        # Build period SQL
        if period == "day":
            period_expr = "DATE(order_date)"
        elif period == "week":
            period_expr = "DATE(order_date, 'weekday 0')"
        elif period == "month":
            period_expr = "STRFTIME('%Y-%m', order_date)"
        elif period == "quarter":
            period_expr = "STRFTIME('%Y-Q', order_date)"
        elif period == "year":
            period_expr = "STRFTIME('%Y', order_date)"
        else:
            period_expr = "DATE(order_date)"
        
        query = f"""
            SELECT 
                {period_expr} as period,
                ROUND(SUM(sales), 2) as sales,
                ROUND(SUM(profit), 2) as profit,
                COUNT(DISTINCT order_id) as orders
            FROM sales
            WHERE 1=1
        """
        
        params = {}
        if region:
            query += " AND region = :region"
            params["region"] = region
        if category:
            query += " AND category = :category"
            params["category"] = category
        
        query += f" GROUP BY {period_expr} ORDER BY period ASC"
        
        results = db.execute(text(query), params).fetchall()
        
        return [
            {
                "period": r[0],
                "sales": float(r[1] or 0),
                "profit": float(r[2] or 0),
                "orders": int(r[3] or 0),
            }
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching sales trend: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trend data")
