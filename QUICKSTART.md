# MetricMind - Getting Started in 5 Minutes

## What is MetricMind?

MetricMind is an AI-powered business intelligence backend that lets you ask questions like:
- "What is our total revenue?" 
- "Which region has the highest profit?"
- "Show me sales trends by category"

And it automatically generates SQL, executes it, and returns results with suggested visualizations.

## Quick Setup (5 minutes)

### Option 1: Using Quick Start Script (Recommended for Windows)

```powershell
# Open PowerShell in the MetricMind directory and run:
.\start.ps1

# Or for Command Prompt:
start.bat
```

This will:
1. Create virtual environment
2. Install dependencies
3. Set up database
4. Start the API at http://localhost:8000

### Option 2: Manual Setup

```powershell
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file
Copy-Item .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-...

# 4. Initialize database
python -c "from app.database import init_db; init_db()"

# 5. Load sample data (optional)
python scripts/load_data.py

# 6. Start API
python -m uvicorn app.main:app --reload
```

## Test the API

Once running, visit: **http://localhost:8000/docs**

Try this in the Swagger UI:
1. Click `POST /api/query`
2. Click "Try it out"
3. Enter: `{"question": "What is total revenue?"}`
4. Click "Execute"

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check API status |
| `/api/metrics` | GET | List available metrics |
| `/api/dimensions` | GET | List available dimensions |
| `/api/query` | POST | Ask a business question |

## Example Queries

```bash
# In your terminal or REST client:

# Revenue by region
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show revenue by region"}'

# Top products
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are our top 10 products by profit?"}'

# Trend analysis
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the monthly sales trend?"}'
```

## Response Example

```json
{
  "question": "Which region has the highest profit?",
  "answer": "The West region has the highest profit with $108,418.45.",
  "sql": "SELECT region, SUM(profit) as profit FROM sales GROUP BY region ORDER BY profit DESC LIMIT 100",
  "metrics_used": ["profit"],
  "dimensions_used": ["region"],
  "data": [
    {"region": "West", "profit": 108418.45},
    {"region": "East", "profit": 91522.78}
  ],
  "chart": {
    "type": "bar",
    "x": "region",
    "y": "profit"
  },
  "execution_time_ms": 12.4,
  "row_count": 4
}
```

## File Structure

```
MetricMind/
├── app/                              # Main application
│   ├── main.py                      # FastAPI entry point
│   ├── database.py                  # Database setup
│   ├── models.py                    # Data models
│   ├── schemas.py                   # Request/response schemas
│   ├── api/routes.py                # API endpoints
│   ├── semantic_layer/              # Metrics & dimensions
│   │   ├── metrics.yaml            # Available metrics
│   │   ├── dimensions.yaml         # Available dimensions
│   │   └── loader.py               # Loader
│   ├── agent/                       # LLM agent
│   │   ├── agent.py                # Agent orchestration
│   │   ├── prompts.py              # LLM prompts
│   │   └── tools.py                # Agent tools
│   ├── sql/                         # SQL generation
│   │   ├── generator.py            # Query builder
│   │   └── validator.py            # Safety checks
│   └── services/                    # Business logic
│       ├── query_service.py        # Query processing
│       └── analysis_service.py     # Analysis & insights
├── data/                            # Data files
│   └── MetricMind_Superstore_Sample.csv
├── scripts/                         # Utilities
│   └── load_data.py                # CSV loader
├── tests/                           # Tests
│   └── test_api.py                 # API tests
├── README.md                        # Full documentation
├── API_REFERENCE.md                # API examples
├── requirements.txt                # Python packages
├── .env.example                    # Configuration template
├── start.ps1                       # Quick start (PowerShell)
└── start.bat                       # Quick start (Command Prompt)
```

## How It Works (Behind the Scenes)

1. **You ask a question**: "Which region has the highest profit?"
2. **LLM understands it**: Extracts metrics (profit) and dimensions (region)
3. **SQL is generated**: Safe, validated query is built
4. **Database executes**: Results are fetched
5. **Answer is generated**: Natural language response created
6. **Visualization suggested**: Chart type recommended
7. **Response returned**: With data, SQL, answer, and chart config

## Available Metrics

- **Revenue**: Total sales
- **Profit**: Total profit
- **Margin**: Profit as % of revenue
- **Orders**: Number of unique orders
- **Customers**: Number of unique customers
- **Quantity**: Total quantity ordered
- **Average Order Value**: Revenue per order

See `/api/metrics` for full list

## Available Dimensions

- **Geographic**: region, state, city, country
- **Product**: category, sub_category, product_name
- **Customer**: segment, customer_id
- **Time**: order_date, year, month, quarter
- **Shipping**: ship_mode, ship_date

See `/api/dimensions` for full list

## Troubleshooting

### "Python not found"
- Install from https://www.python.org/ (3.11+)
- Make sure "Add to PATH" is checked during install

### "OPENAI_API_KEY not set"
- Get key from https://platform.openai.com/account/api-keys
- Add to `.env` file: `OPENAI_API_KEY=sk-...`
- Restart API

### "Port 8000 already in use"
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "Database locked"
```powershell
# Delete old database and start fresh
Remove-Item metricmind.db
python -c "from app.database import init_db; init_db()"
```

### "CSV data not loading"
```powershell
# Check file path
Test-Path data\MetricMind_Superstore_Cleaned.csv

# Reload data
python scripts\load_data.py --file data\MetricMind_Superstore_Cleaned.csv
```

## Next Steps

1. ✅ Set up API (this section)
2. ✅ Load data (from CSV or use sample)
3. ✅ Try example queries
4. 🔜 Read full [README.md](README.md)
5. 🔜 Check [API_REFERENCE.md](API_REFERENCE.md) for more examples
6. 🔜 Add your own metrics/dimensions (edit YAML files)
7. 🔜 Build frontend UI for visualization
8. 🔜 Deploy to production

## Key Features

✅ **Natural Language Understanding** - Ask questions naturally
✅ **Semantic Layer** - Pre-defined metrics prevent errors
✅ **SQL Safety** - No injection, only SELECT allowed
✅ **LLM-Powered** - Uses OpenAI, Claude, or other providers
✅ **Fast Queries** - Indexed database for performance
✅ **Chart Ready** - Automatic visualization suggestions
✅ **Full API Docs** - Interactive Swagger at /docs
✅ **Easy Setup** - Quick start scripts included
✅ **Production Ready** - Comprehensive error handling

## Documentation

- **[README.md](README.md)** - Full setup guide and documentation
- **[API_REFERENCE.md](API_REFERENCE.md)** - API examples and usage patterns
- **[API Docs (Interactive)](http://localhost:8000/docs)** - Swagger UI (when running)

## Need Help?

1. Check [README.md](README.md) - comprehensive guide
2. Check [API_REFERENCE.md](API_REFERENCE.md) - examples
3. Enable DEBUG in .env for verbose logging
4. Review generated SQL in API responses
5. Test endpoints in Swagger UI at `/docs`

## Questions to Try

1. "What is our total revenue?"
2. "Revenue by region"
3. "Which category is most profitable?"
4. "Show me profit margin"
5. "Top 10 customers by sales"
6. "Sales by segment"
7. "Average order value by region"
8. "Monthly revenue trend"
9. "Compare profit across categories"
10. "How many customers per region?"

---

**Ready? Run `.\start.ps1` and visit http://localhost:8000/docs** 🚀
