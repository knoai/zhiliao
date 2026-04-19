import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Uuid
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    
    # 角色和权限字段
    is_admin = Column(Boolean, default=False)  # 是否为管理员
    is_superadmin = Column(Boolean, default=False)  # 是否为超管
    is_approved = Column(Boolean, default=False)  # 是否通过审核
    approved_at = Column(DateTime(timezone=True), nullable=True)  # 审核通过时间
    approved_by = Column(Uuid, nullable=True)  # 审核人ID
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    docs = relationship("Doc", back_populates="user", cascade="all, delete-orphan")
    books = relationship("Book", back_populates="user", cascade="all, delete-orphan")
    chapters = relationship("Chapter", back_populates="user", cascade="all, delete-orphan")
