"""
Database Models
Defines the SQLAlchemy models for the Superstore data
and MetricMind users.
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Index,
    Integer,
    String,
)
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class FlexibleDate(TypeDecorator):
    impl = Date
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if isinstance(value, str):
            return date.fromisoformat(value)
        return value


class SalesRecord(Base):
    """
    Represents a single sales transaction
    from the Superstore dataset.
    """

    __tablename__ = "sales"

    row_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        String(50),
        index=True,
        nullable=False
    )

    order_date = Column(
        FlexibleDate,
        index=True,
        nullable=False
    )

    ship_date = Column(FlexibleDate)

    ship_mode = Column(
        String(50)
    )

    customer_id = Column(
        String(50),
        index=True,
        nullable=False
    )

    customer_name = Column(
        String(255)
    )

    segment = Column(
        String(50),
        index=True
    )

    country = Column(
        String(100),
        index=True
    )

    city = Column(
        String(100),
        index=True
    )

    state = Column(
        String(100),
        index=True
    )

    postal_code = Column(
        String(20)
    )

    region = Column(
        String(50),
        index=True
    )

    product_id = Column(
        String(50),
        index=True
    )

    category = Column(
        String(100),
        index=True
    )

    sub_category = Column(
        String(100),
        index=True
    )

    product_name = Column(
        String(255)
    )

    sales = Column(
        Float,
        nullable=False
    )

    quantity = Column(
        Integer
    )

    discount = Column(
        Float
    )

    profit = Column(
        Float
    )

    __table_args__ = (
        Index(
            "idx_region_date",
            "region",
            "order_date"
        ),
        Index(
            "idx_category_date",
            "category",
            "order_date"
        ),
        Index(
            "idx_segment_region",
            "segment",
            "region"
        ),
    )

    def __repr__(self):
        return (
            f"<SalesRecord("
            f"order_id={self.order_id}, "
            f"customer={self.customer_name}, "
            f"sales={self.sales})>"
        )


class User(Base):
    """
    Represents a MetricMind user account.
    """

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(255),
        nullable=False
    )

    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(
        String(255),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    def __repr__(self):
        return (
            f"<User("
            f"username={self.username}, "
            f"email={self.email})>"
        )