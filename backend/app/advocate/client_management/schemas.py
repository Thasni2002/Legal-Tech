from pydantic import BaseModel, EmailStr

# -------- Client --------

class ClientBase(BaseModel):
    client_id: str
    full_name: str
    email: EmailStr
    phone: str


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class ClientOut(ClientBase):
    id: int

    class Config:
        from_attributes = True