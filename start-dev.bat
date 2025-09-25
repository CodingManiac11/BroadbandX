@echo off
REM BroadbandX - Development Start Script for Windows

echo 🌐 Starting BroadbandX Development Environment...

REM Start Backend Server
echo 🔧 Starting Backend Server (Port 5000)...
cd server
start "Backend Server" cmd /k "npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start Frontend Client
echo 🎨 Starting Frontend Client (Port 3000)...
cd ..\client
start "Frontend Client" cmd /k "npm start"

echo.
echo 🎉 BroadbandX Development Environment Started!
echo.
echo 📱 Frontend (React):     http://localhost:3000
echo 🔧 Backend API:          http://localhost:5000
echo 📊 MongoDB Atlas:        Connected via environment variables
echo.
echo 📋 Quick Commands:
echo    • Backend logs:       cd server ^&^& npm run dev
echo    • Frontend logs:      cd client ^&^& npm start
echo.
echo 🔑 Admin Credentials:
echo    Email: admin@broadbandx.com
echo    Password: admin123
echo.
echo 👤 Test Customer:
echo    Email: john.doe@example.com
echo    Password: password123
echo.
echo Press any key to exit...
pause > nul