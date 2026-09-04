"""
Database Models
Defines the SQLAlchemy models for the Superstore data and user management.
"""
from sqlalchemy import Column, Integer, String, Float, Date, Index, DateTime, Boolean
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.declarative import declarative_base
from datetime import date, datetime

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
    Represents a single sales transaction from the Superstore dataset.
    """

    __tablename__ = "sales"

    row_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), index=True, nullable=False)
    order_date = Column(FlexibleDate, index=True, nullable=False)
    ship_date = Column(FlexibleDate)
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


class User(Base):
    """
    Represents a MetricMind user account.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)  # user, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(username={self.username}, email={self.email}, role={self.role})>"


class LoginActivity(Base):
    """
    Tracks user login/logout activity for auditing.
    """

    __tablename__ = "login_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False)  # login, logout
    login_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    logout_time = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(50), default="success", nullable=False)  # success, failed

    def __repr__(self):
        return f"<LoginActivity(user_id={self.user_id}, action={self.action}, time={self.login_time})>"


class QueryHistory(Base):
    """
    Tracks queries executed by users.
    """

    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    question = Column(String(1000), nullable=False)
    metrics = Column(String(500), nullable=True)  # JSON array
    dimensions = Column(String(500), nullable=True)  # JSON array
    sql_query = Column(String(5000), nullable=True)
    result_rows = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    status = Column(String(50), default="success", nullable=False)  # success, error
    error_message = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<QueryHistory(user_id={self.user_id}, question={self.question[:50]})>"


class DatasetUpload(Base):
    """
    Tracks dataset uploads by users.
    """

    __tablename__ = "dataset_uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    rows_imported = Column(Integer, default=0)
    columns = Column(String(1000), nullable=True)  # JSON array
    status = Column(String(50), default="success", nullable=False)  # success, error
    error_message = Column(String(1000), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<DatasetUpload(user_id={self.user_id}, filename={self.filename})>"
