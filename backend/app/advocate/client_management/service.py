from sqlalchemy.orm import Session
from app.advocate.client_management.models import Client
from app.advocate.client_management.schemas import ClientCreate, ClientUpdate

# CREATE CLIENT
def create_client(db: Session, client: ClientCreate):
    new_client = Client(**client.dict())
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client


# GET ALL CLIENTS
def get_clients(db: Session):
    return db.query(Client).all()


# GET SINGLE CLIENT
def get_client(db: Session, client_id: str):
    return db.query(Client).filter(Client.client_id == client_id).first()


# UPDATE CLIENT
def update_client(db: Session, client_id: str, updated_data: ClientUpdate):
    client = get_client(db, client_id)
    if not client:
        return None

    for key, value in updated_data.dict(exclude_unset=True).items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)
    return client


# DELETE CLIENT
def delete_client(db: Session, client_id: str):
    client = get_client(db, client_id)
    if not client:
        return None

    db.delete(client)
    db.commit()
    return client