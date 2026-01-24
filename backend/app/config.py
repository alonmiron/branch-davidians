"""
Configuration settings for the application
"""
import os
from pathlib import Path

# Base directory (backend)
BASE_DIR = Path(__file__).resolve().parent.parent

# Database: allow override via env (e.g. production). Use absolute path for consistency.
_DB_PATH = os.getenv("DATABASE_PATH")
if _DB_PATH:
    DATABASE_PATH = str(Path(_DB_PATH).resolve())
else:
    DATABASE_PATH = str((BASE_DIR / "billing.db").resolve())

# SQLite URL: use forward slashes so it works on Linux and Windows
_db_uri = Path(DATABASE_PATH).as_posix()
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_db_uri}"

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



