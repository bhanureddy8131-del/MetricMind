"""
Test Suite for MetricMind API
Basic tests to verify API functionality.

Run with: pytest tests/test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.models import SalesRecord

# Create test database
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    """Override get_db for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown():
    """Setup and teardown for each test."""
    # Setup: Clear database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield

    # Teardown
    Base.metadata.drop_all(bind=engine)


class TestHealthCheck:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test /api/health endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestMetricsEndpoint:
    """Test metrics endpoint."""

    def test_list_metrics(self):
        """Test /api/metrics endpoint."""
        response = client.get("/api/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "count" in data
        assert data["count"] > 0
        
        # Verify expected metrics
        metric_names = [m["name"] for m in data["metrics"]]
        assert "revenue" in metric_names
        assert "profit" in metric_names


class TestDimensionsEndpoint:
    """Test dimensions endpoint."""

    def test_list_dimensions(self):
        """Test /api/dimensions endpoint."""
        response = client.get("/api/dimensions")
        assert response.status_code == 200
        data = response.json()
        assert "dimensions" in data
        assert "count" in data
        assert data["count"] > 0
        
        # Verify expected dimensions
        dim_names = [d["name"] for d in data["dimensions"]]
        assert "region" in dim_names
        assert "category" in dim_names


class TestQueryEndpoint:
    """Test query endpoint."""

    def test_query_empty_question(self):
        """Test query with empty question."""
        response = client.post("/api/query", json={"question": ""})
        assert response.status_code == 400

    def test_query_no_data(self):
        """Test query when no data in database."""
        response = client.post("/api/query", json={"question": "What is total revenue?"})
        # Should not crash, but will have no data
        assert response.status_code in [200, 400]

    def test_query_with_sample_data(self):
        """Test query with sample data."""
        # Add sample data
        db = TestingSessionLocal()
        sample_record = SalesRecord(
            row_id=1,
            order_id="ORD-001",
            order_date="2024-01-01",
            customer_id="CUST-001",
            region="West",
            category="Technology",
            sales=1000.0,
            profit=250.0,
            quantity=2,
            discount=0.0,
        )
        db.add(sample_record)
        db.commit()
        db.close()

        # Test query
        response = client.post("/api/query", json={"question": "What is total revenue?"})
        # May fail if LLM not configured, but should not crash
        assert response.status_code in [200, 400]


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root(self):
        """Test / endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert data["name"] == "MetricMind"
        assert "endpoints" in data


class TestErrorHandling:
    """Test error handling."""

    def test_query_too_long(self):
        """Test query that's too long."""
        long_question = "a" * 2000
        response = client.post("/api/query", json={"question": long_question})
        assert response.status_code == 400

    def test_invalid_json(self):
        """Test invalid JSON."""
        response = client.post("/api/query", data="invalid json")
        assert response.status_code in [400, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
