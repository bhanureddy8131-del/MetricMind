@echo off
REM MetricMind Quick Start Script for Windows
REM This script sets up and starts the MetricMind backend

setlocal enabledelayedexpansion

echo.
echo ========================================
echo MetricMind Backend - Quick Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1] Checking Python version...
python --version

REM Check if virtual environment exists
if not exist "venv" (
    echo.
    echo [2] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
) else (
    echo.
    echo [2] Virtual environment already exists
)

REM Activate virtual environment
echo.
echo [3] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo [4] Upgrading pip...
python -m pip install --upgrade pip --quiet

REM Install requirements
echo.
echo [5] Installing dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt --quiet
    if errorlevel 1 (
        echo [WARNING] Some dependencies may not have installed correctly
        echo Continuing anyway...
    ) else (
        echo Dependencies installed successfully
    )
) else (
    echo [ERROR] requirements.txt not found
    pause
    exit /b 1
)

REM Check for .env file
echo.
echo [6] Checking environment configuration...
if not exist ".env" (
    echo [WARNING] .env file not found
    echo Creating from .env.example...
    if exist ".env.example" (
        copy .env.example .env
        echo Created .env file
        echo [IMPORTANT] Edit .env and add your OPENAI_API_KEY!
        echo Pausing to let you edit...
        notepad .env
    ) else (
        echo [ERROR] .env.example not found
    )
) else (
    echo .env file already exists
)

REM Initialize database
echo.
echo [7] Initializing database...
python -c "from app.database import init_db; init_db()" 2>nul
if errorlevel 1 (
    echo [WARNING] Database initialization had issues
) else (
    echo Database initialized successfully
)

REM Load sample data
echo.
echo [8] Loading sample data...
if exist "data\MetricMind_Superstore_Sample.csv" (
    python scripts\load_data.py --file "data\MetricMind_Superstore_Sample.csv" 2>nul
    if errorlevel 1 (
        echo [WARNING] Sample data loading had issues
        echo Try running manually: python scripts\load_data.py
    )
)

REM Start the API
echo.
echo ========================================
echo [9] Starting MetricMind API...
echo ========================================
echo.
echo API will be available at: http://localhost:8000
echo API Docs (Swagger UI): http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
