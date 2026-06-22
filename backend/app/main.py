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
from app.advocate.dashboard.routes import router as dashboard_router
from app.advocate.lawfirm_management.routes import router as lawfirm_router
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

# Include routers
app.include_router(auth_router)
app.include_router(consultations_router)
app.include_router(finance_router)
app.include_router(client_router)
app.include_router(dashboard_router)
app.include_router(lawfirm_router)
app.include_router(permissions_router)
