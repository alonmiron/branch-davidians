"""
Configuration settings for the application
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Database
DATABASE_PATH = os.path.join(BASE_DIR, "billing.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# API Settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS Settings
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Add production URL if specified
PRODUCTION_URL = os.getenv("PRODUCTION_URL")
if PRODUCTION_URL:
    CORS_ORIGINS.append(PRODUCTION_URL)



