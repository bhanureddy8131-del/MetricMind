"""
Query Service
Handles query execution, result processing, and coordination.
"""
import time
import logging
from typing import Dict, List, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.agent.agent import get_agent
from app.semantic_layer.loader import semantic_layer
from app.sql.generator import SQLGenerator, SQLValidator
from app.sql.validator import QueryValidator

logger = logging.getLogger(__name__)


class QueryService:
    """
    Main service for processing business questions.
    Orchestrates: question parsing -> SQL generation -> execution -> analysis.
    """

    @staticmethod
    def process_question(question: str, db: Session) -> Dict[str, Any]:
        """
        Process a natural language question end-to-end.

        Args:
            question: Natural language business question
            db: Database session

        Returns:
            Dictionary with results, SQL, metrics, dimensions, etc.
        """
        start_time = time.time()

        try:
            # Step 1: Parse question using LLM agent
            logger.info(f"Processing question: {question}")
            agent = get_agent()
            parsed = agent.parse_question(question)

            metrics_used = parsed.get("metrics", [])
            dimensions_used = parsed.get("dimensions", [])
            filters = parsed.get("filters", {})

            # Validate parsed metrics and dimensions
            invalid_metrics = [m for m in metrics_used if not semantic_layer.validate_metric(m)]
            invalid_dimensions = [d for d in dimensions_used if not semantic_layer.validate_dimension(d)]

            if invalid_metrics or invalid_dimensions:
                error_msg = ""
                if invalid_metrics:
                    error_msg += f"Invalid metrics: {invalid_metrics}. "
                if invalid_dimensions:
                    error_msg += f"Invalid dimensions: {invalid_dimensions}."

                return {
                    "error": error_msg,
                    "details": f"Question could not be understood. {error_msg}",
                    "question": question,
                }

            # Step 2: Generate SQL
            if not metrics_used:
                return {
                    "error": "No metrics identified",
                    "details": "Could not identify what metrics to query",
                    "question": question,
                }

            sql = SQLGenerator.build_query(
                metrics=metrics_used,
                dimensions=dimensions_used,
                filters=filters,
                limit=100,
                semantic_layer=semantic_layer,
            )

            logger.info(f"Generated SQL: {sql}")

            # Step 3: Validate SQL
            is_valid, error_msg, sanitized_sql = SQLGenerator.validate_and_prepare_query(sql)
            if not is_valid:
                return {
                    "error": "SQL validation failed",
                    "details": error_msg,
                    "question": question,
                    "sql": sql,
                }

            # Additional validation
            is_valid, validation_errors = QueryValidator.comprehensive_validation(sql)
            if not is_valid:
                return {
                    "error": "Query validation failed",
                    "details": "; ".join(validation_errors),
                    "question": question,
                    "sql": sql,
                }

            # Step 4: Execute query
            try:
                result = db.execute(text(sql))
                rows = result.fetchall()
                data = [dict(row._mapping) for row in rows]
                row_count = len(data)

                logger.info(f"Query executed successfully, {row_count} rows returned")

            except Exception as e:
                logger.error(f"Query execution error: {e}")
                return {
                    "error": "Query execution failed",
                    "details": str(e),
                    "question": question,
                    "sql": sql,
                }

            # Step 5: Generate answer
            answer = agent.generate_response(
                question=question,
                results=data,
                row_count=row_count,
                metrics=metrics_used,
                dimensions=dimensions_used,
            )

            # Step 6: Suggest chart type
            chart_config = QueryService._suggest_chart(metrics_used, dimensions_used, data)

            execution_time = (time.time() - start_time) * 1000  # Convert to ms

            return {
                "question": question,
                "answer": answer,
                "sql": sql,
                "metrics_used": metrics_used,
                "dimensions_used": dimensions_used,
                "data": data,
                "chart": chart_config,
                "execution_time_ms": round(execution_time, 2),
                "row_count": row_count,
            }

        except Exception as e:
            logger.error(f"Error processing question: {e}", exc_info=True)
            execution_time = (time.time() - start_time) * 1000
            return {
                "error": "Internal server error",
                "details": str(e),
                "question": question,
                "execution_time_ms": round(execution_time, 2),
            }

    @staticmethod
    def _suggest_chart(metrics: List[str], dimensions: List[str], data: List[Dict]) -> Dict[str, Any]:
        """
        Suggest appropriate chart type based on metrics and dimensions.

        Args:
            metrics: Metric names
            dimensions: Dimension names
            data: Query results

        Returns:
            Chart configuration
        """
        if not metrics:
            return {"type": "table"}

        metric = metrics[0]

        if not dimensions:
            # Single metric, no dimensions -> KPI card or gauge
            return {"type": "gauge", "y": metric}

        if len(dimensions) == 1:
            # One dimension, one metric -> bar or line chart
            if len(data) > 10:
                return {
                    "type": "bar",
                    "x": dimensions[0],
                    "y": metric,
                }
            else:
                return {
                    "type": "pie",
                    "x": dimensions[0],
                    "y": metric,
                }

        if len(dimensions) == 2:
            # Two dimensions -> grouped bar chart
            return {
                "type": "bar",
                "x": dimensions[0],
                "y": metric,
                "group_by": dimensions[1],
            }

        # Multiple dimensions -> table
        return {"type": "table"}


class AggregationService:
    """
    Service for additional aggregations and calculations.
    Useful for computing derived metrics or summaries.
    """

    @staticmethod
    def calculate_growth_rate(current_value: float, previous_value: float) -> float:
        """Calculate percentage growth rate."""
        if previous_value == 0:
            return 0
        return ((current_value - previous_value) / abs(previous_value)) * 100

    @staticmethod
    def calculate_percentile(data: List[float], percentile: float) -> float:
        """Calculate percentile of a list of values."""
        if not data:
            return 0
        sorted_data = sorted(data)
        index = int((percentile / 100) * len(sorted_data))
        return sorted_data[min(index, len(sorted_data) - 1)]

    @staticmethod
    def summarize_results(data: List[Dict]) -> Dict[str, Any]:
        """Generate statistical summary of results."""
        if not data:
            return {}

        summary = {
            "row_count": len(data),
            "columns": list(data[0].keys()) if data else [],
        }

        # Try to calculate numeric summaries
        for row in data:
            for key, value in row.items():
                if isinstance(value, (int, float)):
                    if key not in summary:
                        summary[key] = {
                            "min": value,
                            "max": value,
                            "sum": value,
                            "count": 1,
                        }
                    else:
                        summary[key]["min"] = min(summary[key]["min"], value)
                        summary[key]["max"] = max(summary[key]["max"], value)
                        summary[key]["sum"] += value
                        summary[key]["count"] += 1

        # Calculate averages
        for key in summary:
            if isinstance(summary[key], dict) and "count" in summary[key]:
                summary[key]["avg"] = summary[key]["sum"] / summary[key]["count"]

        return summary
