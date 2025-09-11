@echo off
echo Starting Geo Suitability Solver Backend...
echo.
echo Checking Python installation...
python --version
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting Flask server on port 5000...
echo Backend will be available at: http://127.0.0.1:5000
echo.
echo Press Ctrl+C to stop the server
echo.
python cluster_api.py
pause 