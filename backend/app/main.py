from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.config import CORS_ORIGINS
from app.routes import customers, charges, error_codes, card_history, auth, manual_payments, import_data
from app.routes import cc_residents, cc_payments, cc_archives

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tax Billing Management System", version="1.0.0")

# CORS middleware for React frontend (uses config: localhost + PRODUCTION_URL if set)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(charges.router, prefix="/api/charges", tags=["charges"])
app.include_router(error_codes.router, prefix="/api/error-codes", tags=["error-codes"])
app.include_router(card_history.router, prefix="/api/card-history", tags=["card-history"])
app.include_router(manual_payments.router, prefix="/api/manual-payments", tags=["manual-payments"])
app.include_router(import_data.router, prefix="/api/import", tags=["data-import"])
app.include_router(cc_residents.router, prefix="/api/cc/residents", tags=["cc-residents"])
app.include_router(cc_payments.router, prefix="/api/cc/payments", tags=["cc-payments"])
app.include_router(cc_archives.router, prefix="/api/cc/archives", tags=["cc-archives"])

@app.get("/")
def root():
    return {"message": "Tax Billing Management System API"}

@app.get("/health")
def health_check():
    """Basic health plus DB check. users_count helps verify user data is persisted."""
    out = {"status": "healthy"}
    try:
        with engine.connect() as conn:
            n = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            out["users_count"] = n
            out["database"] = "ok"
    except Exception as e:
        out["database"] = "error"
        out["database_detail"] = str(e)
    return out


