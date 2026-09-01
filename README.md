# MetricMind - AI-Powered Semantic Business Intelligence Backend

MetricMind is an intelligent backend system that converts natural language business questions into structured data analytics results. Ask questions like "Which region has the highest profit?" and get immediate answers with visualizations.

## Features

✨ **Natural Language Processing**: Ask business questions in plain English
🔒 **Secure SQL Generation**: AI generates safe, validated SQL queries
📊 **Semantic Layer**: Pre-defined metrics and dimensions prevent errors
🚀 **Fast & Reliable**: Optimized database queries with comprehensive validation
📈 **Chart-Ready Data**: Automatic chart type suggestions
📚 **API Documentation**: Interactive Swagger UI at `/docs`

## Architecture

```
MetricMind Backend
├── FastAPI Application (app/main.py)
├── Semantic Layer (metrics & dimensions in YAML)
├── LLM Agent (LangChain-powered query interpretation)
├── SQL Generator & Validator (safe query generation)
├── Database Layer (SQLAlchemy with SQLite/PostgreSQL support)
└── Analysis Services (insights & data quality)
```

## Quick Start - Windows VS Code Setup

### Prerequisites
- Python 3.11 or later
- Git
- VS Code (optional but recommended)

### Step 1: Set Up Python Environment

```powershell
# Open PowerShell in the MetricMind directory

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an error about execution policy, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 2: Install Dependencies

```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Install required packages
pip install -r requirements.txt
```

### Step 3: Configure Environment

```powershell
# Create .env file from example
Copy-Item .env.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY: Get from https://platform.openai.com/api-keys
# - DATABASE_URL: Already set to SQLite (./metricmind.db)
# - LLM_PROVIDER: Set to "openai" (or "anthropic" if preferred)

# Open and edit .env in VS Code
code .env
```

**Getting OpenAI API Key:**
1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key and paste in `.env` as `OPENAI_API_KEY=sk-...`

### Step 4: Initialize Database

```powershell
# Option A: Initialize empty database
python -c "from app.database import init_db; init_db()"

# Option B: Initialize and load sample data
# First, place your CSV file at: data/MetricMind_Superstore_Cleaned.csv
python -c "from app.database import init_db; init_db()"
python scripts/load_data.py --file data/MetricMind_Superstore_Cleaned.csv
```

### Step 5: Run the API

```powershell
# Start the development server
python -m uvicorn app.main:app --reload

# Output should show:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

### Step 6: Test the API

Open browser and navigate to:
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health
- **Metrics List**: http://localhost:8000/api/metrics
- **Dimensions List**: http://localhost:8000/api/dimensions

### Step 7: Try a Query

In the Swagger UI at `/docs`:

1. Click on `POST /api/query`
2. Click "Try it out"
3. In the request body, enter:
   ```json
   {
     "question": "What is our total revenue by region?"
   }
   ```
4. Click "Execute"

## API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{"status": "healthy", "message": "..."}`

### List Available Metrics
```
GET /api/metrics
```
Returns all metrics you can query (revenue, profit, orders, etc.)

### List Available Dimensions
```
GET /api/dimensions
```
Returns all dimensions for filtering/grouping (region, category, date, etc.)

### Process Natural Language Query
```
POST /api/query
Content-Type: application/json

{
  "question": "Which region has the highest profit?"
}
```

**Response:**
```json
{
  "question": "Which region has the highest profit?",
  "answer": "The West region has the highest profit with $108,418.45.",
  "sql": "SELECT region, SUM(profit) as profit FROM sales GROUP BY region...",
  "metrics_used": ["profit"],
  "dimensions_used": ["region"],
  "data": [
    {"region": "West", "profit": 108418.45},
    {"region": "East", "profit": 91522.78},
    ...
  ],
  "chart": {
    "type": "bar",
    "x": "region",
    "y": "profit"
  },
  "execution_time_ms": 45.3,
  "row_count": 4
}
```

## Example Questions

Try these questions with your data:

- "What is total revenue by category?"
- "Show me profit by region"
- "Which customer segment has highest margin?"
- "What was our quarterly revenue trend?"
- "Compare sales across regions"
- "Show top 10 products by profit"
- "What is average order value?"
- "How many customers do we have?"

## Semantic Layer

Metrics and dimensions are defined in YAML files for safety and control:

**Metrics** (`app/semantic_layer/metrics.yaml`):
- revenue: SUM(sales)
- profit: SUM(profit)
- margin: profit/revenue * 100
- orders: COUNT(DISTINCT order_id)
- customers: COUNT(DISTINCT customer_id)
- quantity: SUM(quantity)
- average_order_value: AVG(sales/order)

**Dimensions** (`app/semantic_layer/dimensions.yaml`):
- region, country, state, city
- category, sub_category, product_name
- segment, ship_mode
- order_date, year, month, quarter

To add new metrics or dimensions, edit the YAML files and restart the API.

## Testing

```powershell
# Run tests
pytest tests/test_api.py -v

# Run with coverage
pytest tests/test_api.py --cov=app
```

## Troubleshooting

### API won't start
```powershell
# Check Python version
python --version  # Should be 3.11+

# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process on port 8000
taskkill /PID <PID> /F
```

### LLM not responding
```
Error: OPENAI_API_KEY not set
Solution: 
1. Add OPENAI_API_KEY to .env file
2. Get key from https://platform.openai.com/api-keys
3. Restart API
```

### Database errors
```powershell
# Delete old database and reinitialize
Remove-Item metricmind.db

# Reinitialize
python -c "from app.database import init_db; init_db()"
python scripts/load_data.py --file data/MetricMind_Superstore_Cleaned.csv
```

### CSV not loading
```powershell
# Check CSV path
Test-Path data/MetricMind_Superstore_Cleaned.csv

# Try with full path
python scripts/load_data.py --file C:\MetricMind\data\MetricMind_Superstore_Cleaned.csv

# Check CSV format
# Ensure columns match: row_id, order_id, order_date, etc.
```

## VS Code Setup

### Recommended Extensions
1. **Python** (Microsoft)
2. **Pylance** (Microsoft)
3. **SQLite** (alexcvzz)
4. **REST Client** (humao.rest-client)

### Launch Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "jinja": true,
      "justMyCode": true
    }
  ]
}
```

Then press `F5` to start debugging.

### Rest Client Example

Create `test.http`:
```http
@baseUrl = http://localhost:8000

### Health Check
GET {{baseUrl}}/api/health

### List Metrics
GET {{baseUrl}}/api/metrics

### List Dimensions
GET {{baseUrl}}/api/dimensions

### Query
POST {{baseUrl}}/api/query
Content-Type: application/json

{
  "question": "What is our total revenue by region?"
}
```

Install REST Client extension, then right-click and "Send Request".

## Production Deployment

For production use, consider:

1. **Use PostgreSQL** instead of SQLite
   - Update `DATABASE_URL` in `.env`
   - Install: `pip install psycopg2-binary`

2. **Use Gunicorn**
   ```
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
   ```

3. **Environment Variables**
   - Never commit `.env` file
   - Use `dotenv` or environment variable service
   - Rotate API keys regularly

4. **Monitoring**
   - Add logging service (e.g., CloudWatch, ELK)
   - Add error tracking (e.g., Sentry)
   - Monitor database performance

5. **Security**
   - Use HTTPS (nginx reverse proxy)
   - Restrict CORS origins
   - Implement rate limiting
   - Add authentication/authorization

## Project Structure

```
MetricMind/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app
│   ├── database.py             # SQLAlchemy setup
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic schemas
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # API endpoints
│   ├── semantic_layer/
│   │   ├── __init__.py
│   │   ├── metrics.yaml        # Metric definitions
│   │   ├── dimensions.yaml     # Dimension definitions
│   │   └── loader.py           # YAML loader
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── agent.py            # LLM agent orchestration
│   │   ├── prompts.py          # LLM prompts
│   │   └── tools.py            # Agent tools
│   ├── sql/
│   │   ├── __init__.py
│   │   ├── generator.py        # SQL generation
│   │   └── validator.py        # SQL validation
│   └── services/
│       ├── __init__.py
│       ├── query_service.py    # Query orchestration
│       └── analysis_service.py # Analytics & insights
├── data/
│   └── MetricMind_Superstore_Cleaned.csv
├── scripts/
│   └── load_data.py            # CSV loader
├── tests/
│   ├── __init__.py
│   └── test_api.py             # API tests
├── .env.example                # Environment template
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## Key Files Explained

- **app/main.py**: FastAPI application entry point
- **app/database.py**: Database connection, session management
- **app/models.py**: SQLAlchemy ORM models
- **app/schemas.py**: Pydantic request/response validation
- **app/api/routes.py**: API endpoint definitions
- **app/semantic_layer/loader.py**: Loads and manages metrics/dimensions
- **app/agent/agent.py**: LLM-powered query interpreter
- **app/sql/generator.py**: Generates safe SQL from semantic definitions
- **scripts/load_data.py**: CSV data loading utility

## How It Works

1. **User asks question** → POST /api/query
2. **Agent parses question** → Extract metrics, dimensions, filters
3. **Generator builds SQL** → Using semantic layer definitions
4. **Validator checks SQL** → Ensure it's safe and valid
5. **Execute on database** → Get results
6. **LLM generates answer** → Natural language response
7. **Return with visualization** → Chart configuration included

## Database Schema

The system creates a single `sales` table with columns:
- row_id, order_id, order_date, ship_date
- customer_id, customer_name, segment
- region, state, city, country, postal_code
- category, sub_category, product_id, product_name
- sales, quantity, discount, profit

Indexes are created on:
- region, category, customer_id (single)
- region+date, category+date, segment+region (composite)

## Performance Tips

1. **Limit result size**: API defaults to 100 rows, adjust in SQL generator
2. **Use filters**: Filter by date, region, etc. to reduce data
3. **Indexes**: Already created on common columns
4. **Caching**: Consider adding Redis for frequently asked questions

## Security

✅ Only SELECT queries allowed
✅ SQL injection prevention
✅ Metrics/dimensions whitelist enforcement
✅ Query length limits
✅ Environment variable protection

## Support & Contributing

For issues or feature requests:
1. Check existing documentation
2. Enable DEBUG logging in `.env`
3. Check database file exists at `metricmind.db`
4. Verify CSV file is properly formatted

## License

This project is provided as-is for educational and business use.

## Next Steps

1. ✅ Install and run API
2. ✅ Load sample data
3. ✅ Try example queries
4. ✅ Add your own metrics/dimensions
5. ✅ Build frontend for visualization
6. ✅ Deploy to production

Happy analyzing! 📊
