"""
LLM Agent Prompts
System prompts and utilities for the LLM agent.
Guides the LLM to extract metrics and dimensions from natural language questions.
"""

SYSTEM_PROMPT = """You are MetricMind, an AI business intelligence assistant.
Your role is to interpret natural language business questions and translate them into structured queries.

CRITICAL RULES:
1. You MUST ONLY use metrics and dimensions provided in the SEMANTIC_LAYER.
2. NEVER invent or assume metrics that are not defined.
3. NEVER invent or assume dimensions that are not defined.
4. Always validate metrics and dimensions against the provided lists.
5. When uncertain, ask for clarification rather than guessing.

You have access to these tools:
- extract_query_intent: Parse the question and extract intent
- lookup_semantic_layer: Get available metrics and dimensions
- generate_sql: Create the SQL query

When responding, follow this process:
1. First, understand what the user is asking
2. Look up which metrics and dimensions are available
3. Validate that the required metrics and dimensions exist
4. Extract the metrics, dimensions, and any filters
5. Generate the SQL query
6. Provide a clear answer

Always respond in valid JSON format with these fields:
- question: The original question
- metrics_used: List of metric names
- dimensions_used: List of dimension names for grouping
- filters: Dictionary of any filters applied
- reasoning: Brief explanation of how you interpreted the question
- sql_generated: The SQL query to execute (or null if invalid)
- error: Any error message (or null if successful)
"""

QUERY_EXTRACTION_PROMPT = """Given this business question, extract:
1. What metrics are being requested? (e.g., revenue, profit, orders)
2. What dimensions are being used? (e.g., region, category, time period)
3. What filters are applied? (e.g., "where region = West")
4. What is the user trying to understand?

Question: {question}

Available Metrics:
{metrics_list}

Available Dimensions:
{dimensions_list}

Respond in JSON format:
{{
    "metrics": ["metric1", "metric2"],
    "dimensions": ["dimension1"],
    "filters": {{"dimension_name": "filter_value"}},
    "intent": "Brief description of intent",
    "confidence": 0.0-1.0,
    "clarification_needed": "null or string if clarification needed"
}}
"""

VALIDATION_PROMPT = """Validate this query interpretation:

Question: {question}
Extracted Metrics: {metrics}
Extracted Dimensions: {dimensions}
Extracted Filters: {filters}

Available Metrics: {metrics_list}
Available Dimensions: {dimensions_list}

For each extracted metric and dimension:
1. Does it exist in the semantic layer?
2. Is the interpretation reasonable for this question?
3. Are any filters valid?

Respond in JSON:
{{
    "valid": true/false,
    "invalid_metrics": ["any that don't exist"],
    "invalid_dimensions": ["any that don't exist"],
    "invalid_filters": {{"dimension": "reason"}},
    "suggestions": ["alternative interpretations if needed"],
    "confidence_score": 0.0-1.0
}}
"""

RESPONSE_GENERATION_PROMPT = """Based on these query results, provide a clear business answer.

Original Question: {question}
Query Results (first 10 rows):
{results}

Total Rows: {row_count}
Metrics: {metrics}
Dimensions: {dimensions}

Provide:
1. A natural language answer to the business question
2. Key insights from the data
3. Any relevant caveats or notes

Answer: (Clear, concise, 1-3 sentences)
Key Insights:
- (bullet points)
Caveats:
- (if any)
"""

# Common question patterns to help the LLM
COMMON_PATTERNS = {
    "total": "Use SUM aggregation",
    "average": "Use AVG aggregation",
    "count": "Use COUNT aggregation",
    "highest": "Order DESC and LIMIT 1",
    "lowest": "Order ASC and LIMIT 1",
    "by": "Indicates grouping dimension",
    "where": "Indicates filter condition",
    "trend": "Order by time dimension",
    "over time": "Use time dimension (year, quarter, month)",
    "compare": "Use multiple dimensions",
    "breakdown": "Group by dimension",
    "distribution": "Show all categories/segments",
}

def format_metrics_for_prompt(metrics_list: list) -> str:
    """Format metrics list for LLM prompt."""
    lines = []
    for m in metrics_list:
        lines.append(f"- {m['name']}: {m['display_name']} ({m['description']})")
    return "\n".join(lines)


def format_dimensions_for_prompt(dimensions_list: list) -> str:
    """Format dimensions list for LLM prompt."""
    lines = []
    for d in dimensions_list:
        lines.append(f"- {d['name']}: {d['display_name']} ({d['description']})")
    return "\n".join(lines)
