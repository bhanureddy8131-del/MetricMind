"""
SQL Generator and Validator
Generates safe SQL queries from metrics and dimensions.
Validates queries to prevent injection and ensure they only use SELECT.
"""
import re
import logging
from typing import List, Tuple, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class SQLValidator:
    """
    Validates SQL queries for safety.
    Ensures only SELECT queries are allowed.
    Prevents injection attacks and destructive operations.
    """

    # Dangerous SQL keywords
    DANGEROUS_KEYWORDS = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
        "TRUNCATE", "REPLACE", "EXEC", "EXECUTE", "--", ";"
    ]

    @staticmethod
    def is_safe_query(sql: str) -> Tuple[bool, Optional[str]]:
        """
        Validate if a SQL query is safe to execute.

        Args:
            sql: SQL query to validate

        Returns:
            Tuple of (is_safe: bool, error_message: Optional[str])
        """
        if not sql or not isinstance(sql, str):
            return False, "Query cannot be empty"

        # Check query is not empty after stripping
        sql_stripped = sql.strip()
        if not sql_stripped:
            return False, "Query cannot be empty"

        # Check that query starts with SELECT
        if not sql_stripped.upper().startswith("SELECT"):
            return False, "Only SELECT queries are allowed"

        # Check for dangerous keywords
        sql_upper = sql.upper()
        for keyword in SQLValidator.DANGEROUS_KEYWORDS:
            # More careful check to avoid false positives (e.g., "ORDER" contains "OR")
            if re.search(r'\b' + keyword + r'\b', sql_upper):
                return False, f"Query contains forbidden keyword: {keyword}"

        logger.info(f"Query validation passed: {sql[:100]}...")
        return True, None

    @staticmethod
    def validate_column_exists(column_name: str, db: Session) -> bool:
        """
        Check if a column exists in the sales table.

        Args:
            column_name: Name of column to check
            db: Database session

        Returns:
            True if column exists, False otherwise
        """
        try:
            # Query the sqlite_master table to get column info
            query = text(
                "PRAGMA table_info(sales)"
            )
            result = db.execute(query).fetchall()
            columns = [row[1] for row in result]
            return column_name in columns
        except Exception as e:
            logger.error(f"Error validating column: {e}")
            return False


class SQLGenerator:
    """
    Generates SQL queries from semantic layer definitions.
    Builds safe, validated queries based on metrics and dimensions.
    """

    @staticmethod
    def build_query(
        metrics: List[str],
        dimensions: List[str] = None,
        filters: dict = None,
        order_by: str = None,
        limit: int = 100,
        semantic_layer=None,
        table_name: str = "sales",
    ) -> str:
        """
        Build a SQL query from metrics and dimensions.

        Args:
            metrics: List of metric names
            dimensions: List of dimension names for grouping
            filters: Dictionary of filters {dimension: value}
            order_by: Column to order by
            limit: Maximum rows to return
            semantic_layer: SemanticLayer instance

        Returns:
            SQL query string
        """
        if semantic_layer is None:
            from app.semantic_layer.loader import semantic_layer as sl
            semantic_layer = sl

        dimensions = dimensions or []
        filters = filters or {}

        # Select clause - combine metrics and dimensions
        select_parts = []

        # Add dimensions to SELECT
        for dimension in dimensions:
            dim = semantic_layer.get_dimension(dimension)
            if dim:
                col = dim.get("column_name", dimension)
                select_parts.append(f"{col} AS {dimension}")

        # Add metrics to SELECT
        for metric in metrics:
            met = semantic_layer.get_metric(metric)
            if met:
                sql_expr = met.get("sql_expression", metric)
                select_parts.append(f"{sql_expr} AS {metric}")

        if not select_parts:
            raise ValueError("Must specify at least one metric or dimension")

        select_clause = ", ".join(select_parts)
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table_name):
            raise ValueError("Invalid dataset table name")
        query = f"SELECT {select_clause} FROM {table_name}"

        # Add WHERE clause for filters
        where_parts = []
        for dimension, value in filters.items():
            dim = semantic_layer.get_dimension(dimension)
            if dim:
                col = dim.get("column_name", dimension)
                # Escape single quotes in values
                safe_value = str(value).replace("'", "''")
                where_parts.append(f"{col} = '{safe_value}'")

        if where_parts:
            query += " WHERE " + " AND ".join(where_parts)

        # Add GROUP BY if we have dimensions
        if dimensions:
            group_by_cols = []
            for dimension in dimensions:
                dim = semantic_layer.get_dimension(dimension)
                if dim:
                    col = dim.get("column_name", dimension)
                    group_by_cols.append(col)
            if group_by_cols:
                query += " GROUP BY " + ", ".join(group_by_cols)

        # Add ORDER BY
        if order_by:
            query += f" ORDER BY {order_by} DESC"
        elif dimensions:
            # Default: order by first metric descending
            query += f" ORDER BY {metrics[0]} DESC" if metrics else ""

        # Add LIMIT
        query += f" LIMIT {limit}"

        logger.info(f"Generated query: {query}")
        return query

    @staticmethod
    def validate_and_prepare_query(sql: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validate a query and return validation result.

        Args:
            sql: SQL query to validate

        Returns:
            Tuple of (is_safe: bool, error_message: Optional[str], sanitized_query: Optional[str])
        """
        is_safe, error = SQLValidator.is_safe_query(sql)
        if not is_safe:
            return False, error, None

        return True, None, sql
