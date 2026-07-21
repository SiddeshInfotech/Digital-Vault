import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_new_user = Column(Boolean, default=True)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="owner", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="categories")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(100), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Others")
    date = Column(String(100), nullable=False)
    size = Column(String(50), nullable=False)
    type = Column(String(20), nullable=False)
    icon_color = Column(String(30), default="#3b82f6")
    file_path = Column(Text, nullable=True)
    file_data = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    is_trash = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="documents")
    shares = relationship("SharedDocument", back_populates="document", cascade="all, delete-orphan")


class SharedDocument(Base):
    __tablename__ = "shared_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(100), ForeignKey("documents.id"), nullable=False)
    shared_with_email = Column(String(255), nullable=False)
    shared_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="shares")
