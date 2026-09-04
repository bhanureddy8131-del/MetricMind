# MetricMind - Agentic Semantic BI Engine

A premium, professional Business Intelligence web application with AI-powered natural language querying.

## Features

- **Real-time Dashboard**: Live KPI metrics and analytics
- **Ask MetricMind AI**: Natural language business queries
- **Semantic Layer**: Governed, validated metrics and dimensions
- **Data Management**: CRUD operations on sales data
- **User Authentication**: Secure JWT-based authentication
- **Admin Panel**: User management and system monitoring
- **Responsive Design**: Mobile, tablet, and desktop support

## Technology Stack

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite/MySQL
- JWT Authentication
- Pydantic Validation

### Frontend
- React 19
- Vite
- Tailwind CSS
- Recharts
- React Router

## Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn

## Setup

### 1. Clone and Navigate

```bash
cd C:\MetricMind
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run setup (creates demo users and loads data)
python setup.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (already provided)
# VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Running the Application

### Terminal 1 - Backend Server

```bash
# Activate virtual environment
.venv\Scripts\Activate.ps1

# Start backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at: `http://127.0.0.1:8000`

API Documentation: `http://127.0.0.1:8000/docs`

### Terminal 2 - Frontend Server

```bash
cd frontend

# Start frontend dev server
npm run dev
```

Frontend will be available at: `http://127.0.0.1:5173`

## Demo Credentials

After setup, you can login with:

- **Email**: demo@metricmind.com
- **Password**: demo1234

Admin account:
- **Email**: admin@metricmind.com
- **Password**: admin1234

Analyst account:
- **Email**: analyst@metricmind.com
- **Password**: analyst1234

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Data Management
- `GET /api/v1/data` - Get paginated sales data
- `POST /api/v1/data` - Create new sales record
- `PUT /api/v1/data/{row_id}` - Update sales record
- `DELETE /api/v1/data/{row_id}` - Delete sales record

### Analytics
- `GET /api/v1/analytics/kpis` - Get dashboard KPIs
- `GET /api/v1/analytics/sales-by-region` - Regional breakdown
- `GET /api/v1/analytics/sales-by-category` - Category breakdown
- `GET /api/v1/analytics/top-products` - Top products by sales
- `GET /api/v1/analytics/sales-trend` - Sales trend over time

### Semantic Layer
- `GET /api/metrics` - List available metrics
- `GET /api/dimensions` - List available dimensions
- `POST /api/query` - Execute natural language query
- `POST /api/sql/generate` - Generate SQL from semantic layer
- `POST /api/sql/validate` - Validate SQL query

## Project Structure

```
MetricMind/
├── app/                          # Backend application
│   ├── api/
│   │   ├── routes.py            # Main API routes
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── data.py              # Data management endpoints
│   │   └── analytics.py         # Analytics endpoints
│   ├── services/
│   │   ├── auth_service.py      # Authentication logic
│   │   ├── query_service.py     # Query execution
│   │   └── analysis_service.py  # Data analysis
│   ├── agent/                   # AI agent for queries
│   ├── semantic_layer/          # Metrics & dimensions
│   ├── sql/                     # SQL generation & validation
│   ├── models.py                # Database models
│   ├── schemas.py               # Pydantic schemas
│   ├── database.py              # Database configuration
│   ├── security.py              # JWT & password hashing
│   └── main.py                  # FastAPI app initialization
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── context/             # React context (Auth)
│   │   ├── services/            # API service
│   │   └── App.jsx              # Main app component
│   ├── package.json             # Dependencies
│   └── vite.config.js           # Vite configuration
├── scripts/                     # Utility scripts
├── requirements.txt             # Python dependencies
├── setup.py                     # Setup script
└── .env                         # Environment configuration
```

## Frontend Pages

### Public
- `/login` - Login page
- `/register` - Registration page

### Protected (Authentication Required)
- `/` - Dashboard with KPIs
- `/query` - Ask MetricMind (AI query interface)
- `/analytics` - Analytics dashboard
- `/data` - Data management (CRUD)
- `/datasets` - Dataset management
- `/metrics` - Metrics viewer
- `/dimensions` - Dimensions viewer
- `/history` - Query history
- `/settings` - User settings
- `/admin` - Admin panel (admins only)

## Key Features

### 1. Real Authentication
- User registration with email and username
- Secure password hashing with bcrypt
- JWT-based authentication
- Token refresh mechanism
- Session tracking with login activity

### 2. Dashboard
- Live KPI cards (Sales, Profit, Orders, Customers)
- Interactive charts with real backend data
- Sales by region and top products
- Responsive grid layout

### 3. Data Management
- View, create, update, delete sales records
- Pagination and filtering
- Search functionality
- Real-time database synchronization

### 4. Analytics
- Regional sales breakdown
- Category performance analysis
- Top products ranking
- Sales trends over time with multiple period options
- Date range filtering

### 5. Semantic Layer
- Governed metrics (revenue, profit, orders, etc.)
- Queryable dimensions (region, category, date, etc.)
- AI-powered query parsing
- Validated SQL generation
- Safe, read-only query execution

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./metricmind.db
SECRET_KEY=your-secret-key-change-this
LOG_LEVEL=INFO
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=MetricMind
```

## Development

### Install Additional Development Tools

```bash
# Backend
pip install pytest pytest-cov black flake8

# Frontend
npm install --save-dev eslint prettier
```

### Run Tests

```bash
# Backend tests
pytest tests/

# Frontend tests
npm run test
```

### Code Quality

```bash
# Format backend code
black app/

# Lint frontend code
npm run lint
```

## Production Deployment

### Backend
1. Set `SECRET_KEY` to a strong random value
2. Change `DATABASE_URL` to production database (MySQL/PostgreSQL)
3. Set `LOG_LEVEL` to `WARNING`
4. Configure CORS origins in `app/main.py`
5. Run with production ASGI server (Gunicorn, etc.)

### Frontend
1. Build the application: `npm run build`
2. Serve the `dist/` directory with a web server (Nginx, Apache)
3. Configure API base URL for production

## Security Considerations

✓ Passwords hashed with bcrypt
✓ JWT tokens for stateless authentication
✓ CORS properly configured
✓ SQL injection prevention via ORM
✓ Input validation with Pydantic
✓ Read-only query validation
✓ No secrets in frontend code

## Troubleshooting

### Backend won't start
- Ensure Python 3.9+ is installed
- Check virtual environment activation
- Verify all requirements installed: `pip install -r requirements.txt`
- Check .env file configuration

### Frontend won't connect to backend
- Verify backend is running on http://127.0.0.1:8000
- Check CORS configuration in `app/main.py`
- Ensure VITE_API_BASE_URL in frontend/.env is correct
- Check browser console for error messages

### Database errors
- Delete `metricmind.db` and run `python setup.py` again
- Ensure database directory has write permissions
- Check DATABASE_URL in .env file

### Login fails
- Verify demo user was created: `python setup.py`
- Check backend logs for error messages
- Ensure token is being stored in localStorage

## Support & Documentation

- **API Docs**: http://127.0.0.1:8000/docs (Swagger UI)
- **ReDoc**: http://127.0.0.1:8000/redoc
- **Semantic Layer**: See `app/semantic_layer/metrics.yaml` and `dimensions.yaml`

## License

MetricMind - All Rights Reserved

---

Built with ❤️ for powerful business intelligence
