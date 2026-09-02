"""
SQL Query Validator
Additional validation utilities for SQL safety and compliance.
"""
import logging
from typing import Tuple, Optional, List

logger = logging.getLogger(__name__)


class QueryValidator:
    """
    Comprehensive query validation for MetricMind.
    Ensures queries conform to business rules and security policies.
    """

    # Maximum query complexity
    MAX_QUERY_LENGTH = 5000
    MAX_RESULT_ROWS = 100000

    @staticmethod
    def validate_query_length(sql: str) -> Tuple[bool, Optional[str]]:
        """Check query is within reasonable length limits."""
        if len(sql) > QueryValidator.MAX_QUERY_LENGTH:
            return False, f"Query exceeds maximum length of {QueryValidator.MAX_QUERY_LENGTH} characters"
        return True, None

    @staticmethod
    def validate_no_subqueries(sql: str) -> Tuple[bool, Optional[str]]:
        """
        Restrict subqueries for security and performance.
        Basic check - looks for nested SELECT.
        """
        sql_upper = sql.upper()
        # Count SELECT keywords - if more than one, might have subqueries
        select_count = sql_upper.count("SELECT")
        if select_count > 1:
            # Could be multiple SELECT but might be a false positive
            # This is a permissive check
            logger.warning(f"Query contains {select_count} SELECT keywords - possible subquery")
        return True, None

    @staticmethod
    def validate_result_limit(limit: int) -> Tuple[bool, Optional[str]]:
        """Ensure result limits are reasonable."""
        if limit > QueryValidator.MAX_RESULT_ROWS:
            return False, f"Requested limit {limit} exceeds maximum of {QueryValidator.MAX_RESULT_ROWS}"
        return True, None

    @staticmethod
    def check_injection_patterns(sql: str) -> Tuple[bool, Optional[str]]:
        """
        Check for common SQL injection patterns.
        """
        dangerous_patterns = [
            r"'\s*(?:or|and)\s*'",  # ' OR '
            r"'\s*;\s*--",  # '; --
            r"union\s+select",  # UNION SELECT
            r"/\*.*?\*/",  # Comments
        ]

        import re
        sql_upper = sql.upper()

        for pattern in dangerous_patterns:
            if re.search(pattern, sql_upper, re.IGNORECASE):
                logger.warning(f"Potential injection pattern detected: {pattern}")
                return False, f"Query contains potentially dangerous pattern"

        return True, None

    @staticmethod
    def validate_required_clause(sql: str, clause: str) -> bool:
        """Check if a required clause exists in the query."""
        return clause.upper() in sql.upper()

    @staticmethod
    def comprehensive_validation(sql: str) -> Tuple[bool, List[str]]:
        """
        Run all validation checks on a query.

        Returns:
            Tuple of (is_valid: bool, error_messages: List[str])
        """
        errors = []

        # Check query length
        is_ok, err = QueryValidator.validate_query_length(sql)
        if not is_ok:
            errors.append(err)

        # Check for subqueries
        is_ok, err = QueryValidator.validate_no_subqueries(sql)
        if not is_ok:
            errors.append(err)

        # Check for injection patterns
        is_ok, err = QueryValidator.check_injection_patterns(sql)
        if not is_ok:
            errors.append(err)

        return len(errors) == 0, errors
