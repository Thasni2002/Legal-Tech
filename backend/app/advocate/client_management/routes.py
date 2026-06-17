from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.advocate.client_management import service, schemas

router = APIRouter(prefix="/clients", tags=["Clients"])


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE
@router.post("/", response_model=schemas.ClientOut)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    return service.create_client(db, client)


# READ ALL
@router.get("/", response_model=list[schemas.ClientOut])
def get_clients(db: Session = Depends(get_db)):
    return service.get_clients(db)


# READ ONE
@router.get("/{client_id}", response_model=schemas.ClientOut)
def get_client(client_id: str, db: Session = Depends(get_db)):
    client = service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


# UPDATE
@router.put("/{client_id}", response_model=schemas.ClientOut)
def update_client(client_id: str, data: schemas.ClientUpdate, db: Session = Depends(get_db)):
    client = service.update_client(db, client_id, data)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


# DELETE
@router.delete("/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db)):
    client = service.delete_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}