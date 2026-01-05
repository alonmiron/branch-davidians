from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import customers, charges, error_codes, card_history, auth, manual_payments, import_data

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tax Billing Management System", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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

@app.get("/")
def root():
    return {"message": "Tax Billing Management System API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


