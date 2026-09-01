"""
Database Models
Defines the SQLAlchemy models for the Superstore data.
"""
from sqlalchemy import Column, Integer, String, Float, Date, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class SalesRecord(Base):
    """
    Represents a single sales transaction from the Superstore dataset.
    """

    __tablename__ = "sales"

    row_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), index=True, nullable=False)
    order_date = Column(Date, index=True, nullable=False)
    ship_date = Column(Date)
    ship_mode = Column(String(50))
    customer_id = Column(String(50), index=True, nullable=False)
    customer_name = Column(String(255))
    segment = Column(String(50), index=True)
    country = Column(String(100), index=True)
    city = Column(String(100), index=True)
    state = Column(String(100), index=True)
    postal_code = Column(String(20))
    region = Column(String(50), index=True)
    product_id = Column(String(50), index=True)
    category = Column(String(100), index=True)
    sub_category = Column(String(100), index=True)
    product_name = Column(String(255))
    sales = Column(Float, nullable=False)
    quantity = Column(Integer)
    discount = Column(Float)
    profit = Column(Float)

    # Create composite indexes for common query patterns
    __table_args__ = (
        Index("idx_region_date", "region", "order_date"),
        Index("idx_category_date", "category", "order_date"),
        Index("idx_segment_region", "segment", "region"),
    )

    def __repr__(self):
        return f"<SalesRecord(order_id={self.order_id}, customer={self.customer_name}, sales={self.sales})>"
