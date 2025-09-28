#!/bin/bash
# Task Manager Application Startup Script
# Ports: Frontend (3001), Backend (4001)

echo "🚀 Starting 3DDX Task Manager Application..."
echo "Frontend will run on: http://localhost:3001"
echo "Backend will run on: http://localhost:4001"
echo ""

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "vite|nodemon" 2>/dev/null || echo "No processes to clean"
sleep 2

# Start both services
echo "Starting services..."
npm run dev

echo ""
echo "✅ Application started!"
echo "🌐 Open your browser and go to: http://localhost:3001"