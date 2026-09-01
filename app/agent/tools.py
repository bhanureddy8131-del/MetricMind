"""
LLM Agent Tools
Tool definitions and implementations for the LLM agent.
These are functions that the agent can call to interpret queries.
"""
import json
import logging
from typing import Dict, Any, List, Optional
from app.semantic_layer.loader import semantic_layer

logger = logging.getLogger(__name__)


class AgentTools:
    """
    Tool implementations available to the LLM agent.
    These help the agent extract and validate query intent.
    """

    @staticmethod
    def lookup_semantic_layer() -> Dict[str, Any]:
        """
        Get all available metrics and dimensions.
        The agent calls this to understand what can be queried.
        """
        return {
            "metrics": semantic_layer.list_metrics(),
            "dimensions": semantic_layer.list_dimensions(),
        }

    @staticmethod
    def validate_metric(metric_name: str) -> Dict[str, Any]:
        """Validate if a metric exists in the semantic layer."""
        metric = semantic_layer.get_metric(metric_name)
        if metric:
            return {
                "valid": True,
                "metric_name": metric_name,
                "details": metric,
            }
        else:
            return {
                "valid": False,
                "metric_name": metric_name,
                "error": f"Metric '{metric_name}' not found in semantic layer",
                "available_metrics": [m["name"] for m in semantic_layer.list_metrics()],
            }

    @staticmethod
    def validate_dimension(dimension_name: str) -> Dict[str, Any]:
        """Validate if a dimension exists in the semantic layer."""
        dimension = semantic_layer.get_dimension(dimension_name)
        if dimension:
            return {
                "valid": True,
                "dimension_name": dimension_name,
                "details": dimension,
            }
        else:
            return {
                "valid": False,
                "dimension_name": dimension_name,
                "error": f"Dimension '{dimension_name}' not found in semantic layer",
                "available_dimensions": [d["name"] for d in semantic_layer.list_dimensions()],
            }

    @staticmethod
    def extract_query_intent(question: str) -> Dict[str, Any]:
        """
        Extract intent from a natural language question.
        Identifies potential metrics, dimensions, and filters.
        This is a heuristic-based extraction (would be enhanced by LLM).
        """
        question_lower = question.lower()
        intent_analysis = {
            "question": question,
            "possible_metrics": [],
            "possible_dimensions": [],
            "possible_filters": [],
            "patterns_found": [],
        }

        # Check for metric keywords
        metrics = semantic_layer.list_metrics()
        for metric in metrics:
            if metric["name"] in question_lower:
                intent_analysis["possible_metrics"].append(metric["name"])

        # Check for dimension keywords
        dimensions = semantic_layer.list_dimensions()
        for dim in dimensions:
            if dim["name"] in question_lower or dim["display_name"].lower() in question_lower:
                intent_analysis["possible_dimensions"].append(dim["name"])

        # Check for common patterns
        patterns = {
            "highest": "MAX/DESC ordering",
            "lowest": "MIN/ASC ordering",
            "total": "SUM aggregation",
            "average": "AVG aggregation",
            "by": "GROUP BY clause",
            "trend": "Time-based analysis",
            "compare": "Multiple categories",
        }

        for pattern, meaning in patterns.items():
            if pattern in question_lower:
                intent_analysis["patterns_found"].append({
                    "pattern": pattern,
                    "meaning": meaning
                })

        logger.info(f"Extracted intent from question: {intent_analysis}")
        return intent_analysis

    @staticmethod
    def suggest_similar_metrics(query: str) -> Dict[str, Any]:
        """
        Suggest metrics that might match a user's query.
        Helpful when user asks for something similar to available metrics.
        """
        query_lower = query.lower()
        metrics = semantic_layer.list_metrics()

        suggestions = []
        for metric in metrics:
            # Simple similarity: check if any word matches
            metric_words = set(metric["display_name"].lower().split())
            query_words = set(query_lower.split())
            similarity = len(metric_words & query_words) / max(len(metric_words | query_words), 1)

            if similarity > 0:
                suggestions.append({
                    "metric": metric["name"],
                    "display_name": metric["display_name"],
                    "description": metric["description"],
                    "similarity_score": round(similarity, 2),
                })

        # Sort by similarity
        suggestions.sort(key=lambda x: x["similarity_score"], reverse=True)

        return {
            "query": query,
            "suggestions": suggestions[:5],  # Top 5
        }

    @staticmethod
    def get_metric_details(metric_name: str) -> Dict[str, Any]:
        """Get detailed information about a metric."""
        metric = semantic_layer.get_metric(metric_name)
        if metric:
            return {
                "found": True,
                "metric": metric_name,
                "details": metric,
            }
        else:
            return {
                "found": False,
                "metric": metric_name,
                "error": f"Metric '{metric_name}' not found",
            }

    @staticmethod
    def get_dimension_details(dimension_name: str) -> Dict[str, Any]:
        """Get detailed information about a dimension."""
        dimension = semantic_layer.get_dimension(dimension_name)
        if dimension:
            return {
                "found": True,
                "dimension": dimension_name,
                "details": dimension,
            }
        else:
            return {
                "found": False,
                "dimension": dimension_name,
                "error": f"Dimension '{dimension_name}' not found",
            }


def tool_to_json_schema(tool_name: str, tool_func) -> Dict[str, Any]:
    """
    Convert a tool function to OpenAI JSON schema format.
    Used for OpenAI function calling.
    """
    schemas = {
        "lookup_semantic_layer": {
            "name": "lookup_semantic_layer",
            "description": "Get all available metrics and dimensions in the semantic layer",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
        "validate_metric": {
            "name": "validate_metric",
            "description": "Check if a metric exists in the semantic layer",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric_name": {
                        "type": "string",
                        "description": "Name of the metric to validate",
                    }
                },
                "required": ["metric_name"],
            },
        },
        "validate_dimension": {
            "name": "validate_dimension",
            "description": "Check if a dimension exists in the semantic layer",
            "parameters": {
                "type": "object",
                "properties": {
                    "dimension_name": {
                        "type": "string",
                        "description": "Name of the dimension to validate",
                    }
                },
                "required": ["dimension_name"],
            },
        },
        "extract_query_intent": {
            "name": "extract_query_intent",
            "description": "Extract intent from a natural language question",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The business question to analyze",
                    }
                },
                "required": ["question"],
            },
        },
        "suggest_similar_metrics": {
            "name": "suggest_similar_metrics",
            "description": "Get suggestions for metrics similar to the query",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The metric or concept the user is asking about",
                    }
                },
                "required": ["query"],
            },
        },
    }

    return schemas.get(tool_name, {})


def execute_tool(tool_name: str, tool_input: Dict[str, Any]) -> str:
    """Execute a tool and return the result as a JSON string."""
    try:
        if tool_name == "lookup_semantic_layer":
            result = AgentTools.lookup_semantic_layer()
        elif tool_name == "validate_metric":
            result = AgentTools.validate_metric(tool_input.get("metric_name", ""))
        elif tool_name == "validate_dimension":
            result = AgentTools.validate_dimension(tool_input.get("dimension_name", ""))
        elif tool_name == "extract_query_intent":
            result = AgentTools.extract_query_intent(tool_input.get("question", ""))
        elif tool_name == "suggest_similar_metrics":
            result = AgentTools.suggest_similar_metrics(tool_input.get("query", ""))
        else:
            result = {"error": f"Unknown tool: {tool_name}"}

        return json.dumps(result)
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {e}")
        return json.dumps({"error": str(e)})
