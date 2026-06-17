from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt
from app.database import SessionLocal
from .schemas import RegisterSchema, LoginSchema, TokenSchema
from . import service
from .service import SECRET_KEY, ALGORITHM
from .models import User

router = APIRouter(tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: RegisterSchema, db: Session = Depends(get_db)):
    existing_user = service.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    service.create_user(db, user)
    return {"message": "User registered successfully"}

@router.post("/login", response_model=TokenSchema)
def login(user: LoginSchema, db: Session = Depends(get_db)):
    db_user = service.get_user_by_email(db, user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not service.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = service.create_token({
        "id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
        "username": db_user.username
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/me")
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "role": db_user.role
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

