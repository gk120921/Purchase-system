@echo off
setlocal enabledelayedexpansion
title Procurement System Professional Launcher

echo ==========================================
echo    Procurement System v2.5 (Professional)
echo ==========================================

REM 1. Precision Cleanup (Only target this app's ports)
echo [1/4] Checking if ports 3001 or 5173 are in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a 2>nul
    )
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a 2>nul
    )
)
timeout /t 1 /nobreak >nul

REM 2. Start Backend
echo [2/4] Starting Backend (Port 3001)...
cd /d "%~dp0"
start "Procurement-Backend" /min cmd /c "node backend/index.js > backend_log.txt 2>&1"

REM 3. Start Frontend
echo [3/4] Starting Frontend (Port 5173)...
cd /d "%~dp0\frontend"
start "Procurement-Frontend" /min cmd /c "npm run dev -- --host > ../frontend_log.txt 2>&1"

REM 4. Open Browser Automatically
echo [4/4] Opening Web Browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ------------------------------------------
echo System Started Successfully!
echo ------------------------------------------
echo.
echo Local Access:  http://localhost:5173
echo LAN Access:    http://%COMPUTERNAME%:5173
echo.
echo Press any key to close this window...
pause >nul
