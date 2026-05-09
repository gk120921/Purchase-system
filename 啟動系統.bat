@echo off
echo Starting Procurement System...

start cmd /k "cd backend && node index.js"
start cmd /k "cd frontend && npm run dev"

echo System is launching.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
pause
