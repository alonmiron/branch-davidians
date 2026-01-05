#!/bin/bash

# Quick start script for local development

set -e

echo "=== Tax Billing Management System - Quick Start ==="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

if [ ! -f "billing.db" ]; then
    echo "Initializing database..."
    python -m app.init_db
fi

echo "Starting backend server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait



