# MetricMind Quick Start Script for PowerShell
# Run with: .\start.ps1
# If you get an error about execution policy, run first:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host ""
Write-Host "========================================"
Write-Host "MetricMind Backend - Quick Start"
Write-Host "========================================"
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[1] Checking Python version..." -ForegroundColor Green
    Write-Host "    $pythonVersion"
}
catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from https://www.python.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host ""
    Write-Host "[2] Creating virtual environment..." -ForegroundColor Green
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Virtual environment created successfully" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "[2] Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "[3] Activating virtual environment..." -ForegroundColor Green
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host ""
Write-Host "[4] Upgrading pip..." -ForegroundColor Green
python -m pip install --upgrade pip -q

# Install requirements
Write-Host ""
Write-Host "[5] Installing dependencies..." -ForegroundColor Green
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt -q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Some dependencies may not have installed correctly" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[ERROR] requirements.txt not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for .env file
Write-Host ""
Write-Host "[6] Checking environment configuration..." -ForegroundColor Green
if (-Not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item .env.example .env
        Write-Host "Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "[IMPORTANT] Edit .env and add your OPENAI_API_KEY!" -ForegroundColor Cyan
        Write-Host "Opening .env in Notepad for editing..." -ForegroundColor Cyan
        notepad .env
    }
}
else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

# Initialize database
Write-Host ""
Write-Host "[7] Initializing database..." -ForegroundColor Green
python -c "from app.database import init_db; init_db()" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database initialized successfully" -ForegroundColor Green
}

# Load sample data
Write-Host ""
Write-Host "[8] Loading sample data..." -ForegroundColor Green
if (Test-Path "data\MetricMind_Superstore_Sample.csv") {
    python scripts\load_data.py --file "data\MetricMind_Superstore_Sample.csv" 2>$null
}

# Start the API
Write-Host ""
Write-Host "========================================"
Write-Host "[9] Starting MetricMind API..." -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""
Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs (Swagger UI): http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Read-Host "Press Enter to exit"
