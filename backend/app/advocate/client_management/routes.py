from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from .service import get_case_documents
from .models import Client


router = APIRouter(
    prefix="/clients",
    tags=["Clients"]
)


class ClientResponse(BaseModel):
    id: int
    client_id: str
    full_name: str
    email: str
    phone: str

    class Config:
        from_attributes = True

# Document Response Schema
class DocumentResponse(BaseModel):
    id: int
    document_name: str
    document_type: str
    file_path: str

    class Config:
        from_attributes = True


# Get all clients
@router.get(
    "/",
    response_model=list[ClientResponse]
)
def get_clients(
    db: Session = Depends(get_db)
):
    return db.query(Client).all()


# Get client documents
@router.get(
    "/documents/view",
    response_model=list[DocumentResponse]
)
def view_documents(
    client_id: int,
    advocate_role: str,
    document_type: str = None,
    db: Session = Depends(get_db)
):
    return get_case_documents(
        db=db,
        client_id=client_id,
        advocate_role=advocate_role,
        document_type=document_type
    )