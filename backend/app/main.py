import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.authapp.models import User
from app.authapp.seed import create_default_user
from app.advocate.consultations.models import Consultation
from app.advocate.finance_management.models import Invoice
from app.advocate.client_management.routes import router as client_router
from app.authapp import router as auth_router
from app.advocate.consultations import router as consultations_router
from app.advocate.finance_management import router as finance_router
from app.advocate.permissions import router as permissions_router
from app.advocate.lawfirm_management.routes import router as lawfirm_router
from app.advocate.case_management.routes import router as case_router
from app.utils.scheduler import start_scheduler

app = FastAPI()


# CORS setup
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)

ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)


# Startup event
@app.on_event("startup")
def startup():
    db = SessionLocal()
    create_default_user(db)
    db.close()

    # Automatically add columns to existing tables if they don't exist
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    try:
        if inspector.has_table('case_management_cases'):
            columns = [col['name'] for col in inspector.get_columns('case_management_cases')]
            if 'cnr_number' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE case_management_cases ADD COLUMN cnr_number VARCHAR(100) NULL;"))
                print("Successfully added cnr_number column to case_management_cases table.")
            if 'created_at' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE case_management_cases ADD COLUMN created_at DATETIME NULL;"))
                print("Successfully added created_at column to case_management_cases table.")
            if 'updated_at' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE case_management_cases ADD COLUMN updated_at DATETIME NULL;"))
                print("Successfully added updated_at column to case_management_cases table.")
        if inspector.has_table('consultations'):
            columns = [col['name'] for col in inspector.get_columns('consultations')]
            if 'updated_at' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE consultations ADD COLUMN updated_at DATETIME NULL;"))
                print("Successfully added updated_at column to consultations table.")
    except Exception as e:
        print(f"Error checking/adding migration columns: {e}")

    # Start hearing reminder scheduler
    start_scheduler()


# Health check
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# Routers
app.include_router(auth_router)
app.include_router(consultations_router)
app.include_router(finance_router)
app.include_router(client_router)
app.include_router(lawfirm_router)
app.include_router(permissions_router)
app.include_router(case_router)