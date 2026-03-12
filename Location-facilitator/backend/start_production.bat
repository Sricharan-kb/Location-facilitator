@echo off
REM Production startup script for Geo-Suitability backend (Windows)

echo Starting Geo-Suitability Backend in Production Mode
echo ---------------------------------------------------

REM Check if .env file exists
if not exist .env (
    echo Error: .env file not found!
    echo Please create a .env file based on env.example
    exit /b 1
)

REM Set production environment
set FLASK_ENV=production
set FLASK_DEBUG=False

REM Start with gunicorn
echo Starting server with Gunicorn...
python -m gunicorn ^
    --bind 0.0.0.0:%PORT% ^
    --workers %WORKERS% ^
    --timeout 120 ^
    --access-logfile - ^
    --error-logfile - ^
    "cluster_api:app"
