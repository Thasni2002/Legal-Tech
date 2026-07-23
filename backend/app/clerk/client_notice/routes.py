from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List

from .schemas import ClientNoticeCreate, ClientNoticeUpdate, ClientNoticeOut
from .service import get_client_notices, create_client_notice, update_client_notice, delete_client_notice

router = APIRouter(
    prefix="/clerk/client-notice",
    tags=["Clerk Client Notice"]
)

@router.get("", response_model=List[ClientNoticeOut])
def read_client_notices(db: Session = Depends(get_db)):
    return get_client_notices(db)

@router.post("", response_model=ClientNoticeOut, status_code=status.HTTP_201_CREATED)
def add_client_notice(data: ClientNoticeCreate, db: Session = Depends(get_db)):
    return create_client_notice(db, data)

@router.put("/{notice_id}", response_model=ClientNoticeOut)
def modify_client_notice(notice_id: int, data: ClientNoticeUpdate, db: Session = Depends(get_db)):
    updated = update_client_notice(db, notice_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Client notice record not found")
    return updated

@router.delete("/{notice_id}")
def remove_client_notice(notice_id: int, db: Session = Depends(get_db)):
    success = delete_client_notice(db, notice_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client notice record not found")
    return {"detail": "Client notice record deleted successfully"}
