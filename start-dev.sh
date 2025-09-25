#!/bin/bash

# BroadbandX - Development Start Script

echo "🌐 Starting BroadbandX Development Environment..."

# Function to check if a port is in use
check_port() {
    netstat -an | grep :$1 > /dev/null
    return $?
}

# Start MongoDB (if not running)
echo "📊 Checking MongoDB connection..."

# Start Backend Server
echo "🔧 Starting Backend Server (Port 5000)..."
cd server
if check_port 5000; then
    echo "⚠️  Port 5000 is already in use. Please stop the existing process."
else
    npm start &
    BACKEND_PID=$!
    echo "✅ Backend server started with PID: $BACKEND_PID"
fi

# Wait a moment for backend to start
sleep 3

# Start Frontend Client
echo "🎨 Starting Frontend Client (Port 3000)..."
cd ../client
if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Please stop the existing process."
else
    npm start &
    FRONTEND_PID=$!
    echo "✅ Frontend client started with PID: $FRONTEND_PID"
fi

echo ""
echo "🎉 BroadbandX Development Environment Started!"
echo ""
echo "📱 Frontend (React):     http://localhost:3000"
echo "🔧 Backend API:          http://localhost:5000"
echo "📊 MongoDB Atlas:        Connected via environment variables"
echo ""
echo "📋 Quick Commands:"
echo "   • Backend logs:       cd server && npm run dev"
echo "   • Frontend logs:      cd client && npm start"
echo "   • Stop all:           pkill -f 'node.*server.js' && pkill -f 'react-scripts'"
echo ""
echo "🔑 Admin Credentials:"
echo "   Email: admin@broadbandx.com"
echo "   Password: admin123"
echo ""
echo "👤 Test Customer:"
echo "   Email: john.doe@example.com"
echo "   Password: password123"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait