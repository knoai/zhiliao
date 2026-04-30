import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean, Text, func, Uuid, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Doc(Base):
    """文档模型"""
    __tablename__ = "docs"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(Uuid, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(500), nullable=False, default="无标题文档")
    # Slate JSON格式内容
    content = Column(JSON, nullable=False, default=list)
    word_count = Column(Integer, default=0)
    tags = Column(JSON, default=list)
    
    # 文档状态: draft(草稿), published(已发布)
    status = Column(String(20), default="draft", index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # 可见性: private(私密), public(公开)
    visibility = Column(String(20), default="private", index=True)
    
    # 软删除
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # 版本号
    version = Column(Integer, default=1)
    
    # 排序权重
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="docs")
    folder = relationship("Folder", back_populates="docs")
    versions = relationship("DocVersion", back_populates="doc", lazy="dynamic", cascade="all, delete-orphan")


class DocVersion(Base):
    """文档版本历史"""
    __tablename__ = "doc_versions"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    doc_id = Column(Uuid, ForeignKey("docs.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(JSON, nullable=False)
    word_count = Column(Integer, default=0)
    version = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # 关系
    doc = relationship("Doc", back_populates="versions")
