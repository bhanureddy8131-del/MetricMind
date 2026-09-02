"""
Semantic Layer Loader
Loads metrics and dimensions definitions from YAML files.
Provides a centralized registry of what can be queried.
"""
import yaml
from pathlib import Path
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class SemanticLayer:
    """
    Manages the semantic layer - metrics and dimensions definitions.
    Ensures the LLM can only work with pre-defined, validated metrics and dimensions.
    """

    def __init__(self):
        self.metrics: Dict[str, Dict[str, Any]] = {}
        self.dimensions: Dict[str, Dict[str, Any]] = {}
        self._load_definitions()

    def _load_definitions(self):
        """Load metrics and dimensions from YAML files."""
        base_path = Path(__file__).parent

        # Load metrics
        metrics_path = base_path / "metrics.yaml"
        if metrics_path.exists():
            with open(metrics_path, "r") as f:
                metrics_data = yaml.safe_load(f)
                self.metrics = metrics_data.get("metrics", {})
                logger.info(f"Loaded {len(self.metrics)} metrics")
        else:
            logger.warning(f"Metrics file not found: {metrics_path}")

        # Load dimensions
        dimensions_path = base_path / "dimensions.yaml"
        if dimensions_path.exists():
            with open(dimensions_path, "r") as f:
                dimensions_data = yaml.safe_load(f)
                self.dimensions = dimensions_data.get("dimensions", {})
                logger.info(f"Loaded {len(self.dimensions)} dimensions")
        else:
            logger.warning(f"Dimensions file not found: {dimensions_path}")

    def get_metric(self, metric_name: str) -> Dict[str, Any] | None:
        """Get a metric definition by name."""
        return self.metrics.get(metric_name.lower())

    def get_dimension(self, dimension_name: str) -> Dict[str, Any] | None:
        """Get a dimension definition by name."""
        return self.dimensions.get(dimension_name.lower())

    def list_metrics(self) -> List[Dict[str, Any]]:
        """Return all available metrics with their definitions."""
        return [
            {
                "name": name,
                "display_name": details.get("display_name", name),
                "description": details.get("description", ""),
                "sql_expression": details.get("sql_expression", ""),
            }
            for name, details in self.metrics.items()
        ]

    def list_dimensions(self) -> List[Dict[str, Any]]:
        """Return all available dimensions with their definitions."""
        return [
            {
                "name": name,
                "display_name": details.get("display_name", name),
                "description": details.get("description", ""),
                "column_name": details.get("column_name", name),
            }
            for name, details in self.dimensions.items()
        ]

    def validate_metric(self, metric_name: str) -> bool:
        """Check if a metric is defined in the semantic layer."""
        return metric_name.lower() in self.metrics

    def validate_dimension(self, dimension_name: str) -> bool:
        """Check if a dimension is defined in the semantic layer."""
        return dimension_name.lower() in self.dimensions

    def get_metric_sql(self, metric_name: str) -> str | None:
        """Get the SQL expression for a metric."""
        metric = self.get_metric(metric_name)
        return metric.get("sql_expression") if metric else None

    def get_dimension_column(self, dimension_name: str) -> str | None:
        """Get the column name for a dimension."""
        dimension = self.get_dimension(dimension_name)
        return dimension.get("column_name") if dimension else None


# Singleton instance
semantic_layer = SemanticLayer()
