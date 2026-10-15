@echo off
echo ========================================================
echo Starting TrueQR - The QR Destination Safety Assistant
echo ========================================================
echo.

echo Starting FastAPI Backend on 0.0.0.0:8000 (accessible on LAN at http://172.19.2.220:8000)...
start "TrueQR Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo Starting Vite Frontend on 0.0.0.0:5173 (accessible on LAN at http://172.19.2.220:5173)...
start "TrueQR Frontend (Vite/React)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo ========================================================
echo TrueQR is running!
echo Local (Laptop 1): http://localhost:5173
echo Remote (Laptops 2, 3, 4): http://172.19.2.220:5173
echo Backend API Docs: http://172.19.2.220:8000/docs
echo ========================================================
