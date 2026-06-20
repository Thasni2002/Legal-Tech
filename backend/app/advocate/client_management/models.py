from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.advocate.lawfirm_management.models import Advocate


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String(100), unique=True, index=True)
    full_name = Column(String(100))
    email = Column(String(150))
    phone = Column(String(20))

    documents = relationship("ClientDocument", back_populates="client")


class ClientDocument(Base):
    __tablename__ = "client_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String(255))
    document_type = Column(String(100))
    file_path = Column(String(500))

    client_id = Column(Integer, ForeignKey("clients.id"))

    client = relationship("Client", back_populates="documents")