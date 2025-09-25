@echo off
echo Starting BroadbandX Application...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d c:\Users\adity\OneDrive\Desktop\Quest\server && node server.js"

timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd /d c:\Users\adity\OneDrive\Desktop\Quest\client && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to continue...
pause > nul