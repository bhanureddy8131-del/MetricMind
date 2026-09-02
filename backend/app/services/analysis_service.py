"""
Analysis Service
Performs post-query analysis and insights generation.
"""
import logging
from typing import Dict, List, Any
import statistics

logger = logging.getLogger(__name__)


class AnalysisService:
    """
    Service for analyzing query results and generating insights.
    """

    @staticmethod
    def generate_insights(data: List[Dict], metrics: List[str], dimensions: List[str]) -> List[str]:
        """
        Generate business insights from query results.

        Args:
            data: Query results
            metrics: Metric names used
            dimensions: Dimension names used

        Returns:
            List of insight strings
        """
        insights = []

        if not data:
            return ["No data available for analysis"]

        if not metrics:
            return insights

        metric = metrics[0]

        # Extract numeric values for the primary metric
        values = []
        for row in data:
            if metric in row and isinstance(row[metric], (int, float)):
                values.append(row[metric])

        if not values:
            return insights

        # Find high and low performers
        if dimensions and len(data) > 1:
            sorted_data = sorted(data, key=lambda x: x.get(metric, 0) if isinstance(x.get(metric), (int, float)) else 0, reverse=True)

            # Top performer
            if sorted_data:
                top = sorted_data[0]
                top_key = next((top.get(d) for d in dimensions if d in top), "")
                top_val = top.get(metric, 0)
                if top_key:
                    insights.append(f"{top_key} leads with {metric} of {top_val}")

            # Bottom performer
            if sorted_data and len(sorted_data) > 1:
                bottom = sorted_data[-1]
                bottom_key = next((bottom.get(d) for d in dimensions if d in bottom), "")
                bottom_val = bottom.get(metric, 0)
                if bottom_key:
                    insights.append(f"{bottom_key} has the lowest {metric} of {bottom_val}")

        # Calculate statistics
        if len(values) > 1:
            try:
                avg_val = statistics.mean(values)
                total_val = sum(values)
                max_val = max(values)
                min_val = min(values)

                insights.append(f"Total {metric}: {total_val:.2f}")
                insights.append(f"Average {metric}: {avg_val:.2f}")

                # Identify outliers (values > 2 std deviations from mean)
                try:
                    std_dev = statistics.stdev(values)
                    if std_dev > 0:
                        upper_bound = avg_val + (2 * std_dev)
                        lower_bound = avg_val - (2 * std_dev)
                        outliers = [v for v in values if v > upper_bound or v < lower_bound]
                        if outliers:
                            insights.append(f"Identified {len(outliers)} outlier values")
                except:
                    pass

            except Exception as e:
                logger.debug(f"Could not calculate statistics: {e}")

        return insights

    @staticmethod
    def detect_trends(time_series_data: List[Dict], time_column: str, value_column: str) -> Dict[str, Any]:
        """
        Detect trends in time-series data.

        Args:
            time_series_data: Data sorted by time
            time_column: Name of time column
            value_column: Name of value column

        Returns:
            Trend analysis
        """
        if not time_series_data or len(time_series_data) < 2:
            return {"trend": "insufficient_data"}

        values = []
        for row in time_series_data:
            val = row.get(value_column)
            if isinstance(val, (int, float)):
                values.append(val)

        if len(values) < 2:
            return {"trend": "insufficient_data"}

        # Calculate simple trend
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]

        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)

        if second_avg > first_avg * 1.05:
            trend = "increasing"
        elif second_avg < first_avg * 0.95:
            trend = "decreasing"
        else:
            trend = "stable"

        change_pct = ((second_avg - first_avg) / first_avg * 100) if first_avg != 0 else 0

        return {
            "trend": trend,
            "first_period_avg": round(first_avg, 2),
            "second_period_avg": round(second_avg, 2),
            "change_percent": round(change_pct, 2),
        }

    @staticmethod
    def compare_segments(data: List[Dict], segment_column: str, metric_column: str) -> List[Dict[str, Any]]:
        """
        Compare metric values across segments.

        Args:
            data: Query results
            segment_column: Column defining segments
            metric_column: Metric column to compare

        Returns:
            List of segment comparisons
        """
        if not data or segment_column not in data[0] or metric_column not in data[0]:
            return []

        segments = {}
        for row in data:
            seg = row.get(segment_column)
            val = row.get(metric_column)

            if isinstance(val, (int, float)):
                if seg not in segments:
                    segments[seg] = {"count": 0, "sum": 0, "values": []}
                segments[seg]["count"] += 1
                segments[seg]["sum"] += val
                segments[seg]["values"].append(val)

        comparisons = []
        for seg, data_seg in segments.items():
            try:
                avg = data_seg["sum"] / data_seg["count"]
                comparisons.append({
                    "segment": seg,
                    "average": round(avg, 2),
                    "total": round(data_seg["sum"], 2),
                    "count": data_seg["count"],
                })
            except:
                pass

        return sorted(comparisons, key=lambda x: x["average"], reverse=True)

    @staticmethod
    def validate_data_quality(data: List[Dict]) -> Dict[str, Any]:
        """
        Check data quality of results.

        Args:
            data: Query results

        Returns:
            Data quality report
        """
        if not data:
            return {"quality": "no_data", "issues": ["No data returned"]}

        quality_report = {
            "row_count": len(data),
            "columns": list(data[0].keys()) if data else [],
            "null_counts": {},
            "issues": [],
        }

        # Check for null/empty values
        for col in quality_report["columns"]:
            null_count = sum(1 for row in data if row.get(col) is None or row.get(col) == "")
            if null_count > 0:
                quality_report["null_counts"][col] = null_count
                if null_count > len(data) * 0.5:
                    quality_report["issues"].append(f"Column '{col}' has >50% null values")

        if quality_report["issues"]:
            quality_report["quality"] = "warning"
        else:
            quality_report["quality"] = "good"

        return quality_report
