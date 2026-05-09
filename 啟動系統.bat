@echo off
setlocal enabledelayedexpansion
title Procurement System Professional Launcher

echo ==========================================
echo    Procurement System v2.0 (Compatible Mode)
echo ==========================================

REM 1. Precision Cleanup (Only target this app's ports)
echo [1/3] Checking if ports 3001 or 5173 are in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    if not "%%a"=="0" (
        echo [INFO] Found process %%a on port 3001, clearing for this app...
        taskkill /F /PID %%a 2>nul
    )
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    if not "%%a"=="0" (
        echo [INFO] Found process %%a on port 5173, clearing for this app...
        taskkill /F /PID %%a 2>nul
    )
)
timeout /t 1 /nobreak >nul

REM 2. Start Backend
echo [2/3] Starting Backend (Port 3001)...
cd /d "%~dp0"
if not exist "backend\index.js" (
    echo [ERROR] Cannot find backend\index.js
    pause
    exit
)
start "Procurement-Backend" /min cmd /c "node backend/index.js > backend_log.txt 2>&1"

REM 3. Start Frontend
echo [3/3] Starting Frontend (Port 5173)...
cd /d "%~dp0\frontend"
if not exist "package.json" (
    echo [ERROR] Cannot find frontend folder
    pause
    exit
)
start "Procurement-Frontend" /min cmd /c "npm run dev -- --host > ../frontend_log.txt 2>&1"

REM 4. Get Network Info
set "pc_name=%COMPUTERNAME%"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set "current_ip=%%a"
    set "current_ip=!current_ip: =!"
)

REM 5. Info
timeout /t 5 /nobreak >nul
echo.
echo ------------------------------------------
echo System Started Successfully!
echo.
echo [LAN Access] share this with your team:
echo http://%pc_name%:5173
echo.
echo (This launcher only manages ports 3001/5173)
echo (Your other Node.js projects are SAFE)
echo ------------------------------------------
echo.
echo Press any key to close this window...
pause >nul
