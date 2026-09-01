# MetricMind API Quick Reference

## Common Query Examples

### 1. Total Revenue
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is our total revenue?"}'
```

### 2. Revenue by Region (Bar Chart)
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me revenue by region"}'
```

### 3. Top Products by Profit
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are our top 10 products by profit?"}'
```

### 4. Profit Margin by Category
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show profit margin by category"}'
```

### 5. Regional Comparison
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Compare profit across all regions"}'
```

### 6. Customer Segment Analysis
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Which customer segment has the highest revenue?"}'
```

### 7. Monthly Trend
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the trend of sales by month?"}'
```

### 8. Average Order Value
```bash
curl -X POST "http://localhost:8000/api/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is our average order value?"}'
```

## Supported Query Patterns

### Aggregations
- "total" or "sum" → SUM()
- "average" or "mean" → AVG()
- "count" → COUNT()

### Grouping
- "by [dimension]" → GROUP BY
- "per [dimension]" → GROUP BY
- "across [dimension]" → GROUP BY

### Ranking
- "highest" → ORDER BY DESC
- "lowest" → ORDER BY ASC
- "top 10" → LIMIT 10

### Time-based
- "monthly" → GROUP BY month
- "quarterly" → GROUP BY quarter
- "yearly" → GROUP BY year
- "trend" → ORDER BY time

### Filtering
- "where [dimension] is [value]"
- "in [region/category]"
- "for [time period]"

## Response Structure

Every successful query returns:

```json
{
  "question": "Original question asked",
  "answer": "Natural language answer",
  "sql": "Generated SQL query",
  "metrics_used": ["metric1", "metric2"],
  "dimensions_used": ["dimension1"],
  "data": [
    {"dimension1": "value", "metric1": 1000, "metric2": 500},
    ...
  ],
  "chart": {
    "type": "bar|line|pie|table",
    "x": "dimension_column",
    "y": "metric_column"
  },
  "execution_time_ms": 45.3,
  "row_count": 10
}
```

## Using in JavaScript/Frontend

```javascript
async function queryMetricMind(question) {
  const response = await fetch('http://localhost:8000/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const result = await response.json();
  
  console.log('Answer:', result.answer);
  console.log('SQL:', result.sql);
  console.log('Data:', result.data);
  console.log('Chart:', result.chart);
  
  return result;
}

// Usage
queryMetricMind("Show revenue by region")
  .then(result => {
    // Use result.data for charts
    // Use result.answer for display
    // Use result.chart.type to select chart library
  })
  .catch(err => console.error(err));
```

## Using with Python

```python
import requests
import json

def query_metricmind(question):
    url = "http://localhost:8000/api/query"
    payload = {"question": question}
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    result = response.json()
    print(f"Answer: {result['answer']}")
    print(f"SQL: {result['sql']}")
    print(f"Metrics: {result['metrics_used']}")
    print(f"Rows: {result['row_count']}")
    
    return result

# Usage
result = query_metricmind("What is total revenue by category?")

# Access data
for row in result['data']:
    print(row)
```

## Error Responses

### Empty question
```json
{"detail": "Question cannot be empty"}
```

### No metrics identified
```json
{
  "error": "No metrics identified",
  "details": "Could not identify what metrics to query"
}
```

### Invalid metric/dimension
```json
{
  "error": "Invalid metrics: [...], Invalid dimensions: [...]",
  "details": "Question could not be understood."
}
```

### Database error
```json
{
  "error": "Query execution failed",
  "details": "SQL error details..."
}
```

## Performance Tips

1. **Use specific questions**: "Revenue by region" is better than "Tell me everything"
2. **Filter by time**: Add date filters to reduce data scanned
3. **Limit results**: Results are capped at 100 rows by default
4. **Use GROUP BY**: Aggregates reduce result size significantly

## Debugging

### Enable verbose logging
In `.env`:
```
LOG_LEVEL=DEBUG
DEBUG=True
```

### View generated SQL
The response always includes the `sql` field - review it if results don't match expectations

### Test semantic layer
```bash
curl http://localhost:8000/api/metrics
curl http://localhost:8000/api/dimensions
```

### Check database data
```python
from app.database import SessionLocal
from app.models import SalesRecord

db = SessionLocal()
count = db.query(SalesRecord).count()
print(f"Records in database: {count}")

# Sample a few records
records = db.query(SalesRecord).limit(5).all()
for r in records:
    print(f"{r.order_id}: {r.sales} profit={r.profit}")
```

## Supported LLM Providers

### OpenAI (Recommended)
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo for lower cost
```

### Anthropic Claude
```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Cohere
```
LLM_PROVIDER=cohere
COHERE_API_KEY=...
```

## Database Indexes

For optimal performance, indexes are created on:
- region, category, customer_id (single columns)
- region + order_date (composite)
- category + order_date (composite)
- segment + region (composite)

To add more indexes, modify `models.py` and run migration.

## Limits & Constraints

- Max question length: 1000 characters
- Max results per query: 100 rows (configurable in SQL generator)
- Max query execution time: ~30 seconds before timeout
- Max concurrent connections: Limited by database connection pool

## Best Practices

1. ✅ Use natural language - the system is built to understand it
2. ✅ Be specific - "revenue last quarter" not "show me stuff"
3. ✅ Check the generated SQL - learn how questions map to queries
4. ✅ Use dimensions for grouping - creates better visualizations
5. ✅ Ask follow-up questions - build on previous results

6. ❌ Don't try to be too clever - keep questions clear
7. ❌ Don't ask for undefined metrics - check /api/metrics first
8. ❌ Don't request huge date ranges without filters
9. ❌ Don't rely on LLM if no API key configured (uses fallback parser)
10. ❌ Don't modify SQL manually - always regenerate

## Support

- Check logs in `.vscode/debug-logs/` for errors
- Review generated SQL in response
- Test with `curl` or REST Client extension
- Enable DEBUG mode in `.env` for verbose output
