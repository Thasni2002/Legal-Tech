import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.authapp.models import User
from app.authapp.seed import create_default_user   # import seed
from app.advocate.consultations.models import Consultation
from app.advocate.finance_management.models import Invoice
from app.advocate.client_management.routes import router as client_router
from app.authapp import router as auth_router
from app.advocate.consultations import router as consultations_router
from app.advocate.finance_management import router as finance_router
from app.advocate.permissions import router as permissions_router
from app.advocate.lawfirm_management.routes import router as lawfirm_router
from app.advocate.case_management.routes import router as case_router

app = FastAPI()

# CORS setup — origins are read from env so production domains work without code changes
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

# Create default user on startup
@app.on_event("startup")
def startup():
    db = SessionLocal()
    create_default_user(db)
    db.close()

# Health check endpoint (used by Docker HEALTHCHECK)
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# Include routers
app.include_router(auth_router)
app.include_router(consultations_router)
app.include_router(finance_router)
app.include_router(client_router)
app.include_router(lawfirm_router)
app.include_router(permissions_router)
app.include_router(case_router)



