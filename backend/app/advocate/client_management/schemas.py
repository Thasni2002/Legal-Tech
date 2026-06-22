from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: int
    document_name: str
    document_type: str
    file_path: str

    class Config:
        from_attributes = True

class ClientCreate(BaseModel):
    client_id: str
    full_name: str
    email: str
    phone: str

class ClientUpdate(BaseModel):
    full_name: str
    email: str
    phone: str

class ClientResponse(BaseModel):
    id: int
    client_id: str
    full_name: str
    email: str
    phone: str

    class Config:
        from_attributes = True