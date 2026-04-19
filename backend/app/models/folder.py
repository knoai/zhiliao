import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.database import Base


class Folder(Base):
    """文件夹模型 - 支持嵌套"""
    __tablename__ = "folders"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Uuid, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    # 使用path字段存储层级路径，如 "root.parent.current"
    path = Column(String(1000), nullable=True, index=True)
    # 层级深度
    depth = Column(Integer, default=0)
    sort_order = Column(Integer, default=0, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="folders")
    docs = relationship("Doc", back_populates="folder", lazy="dynamic")
    
    # 自引用关系
    children = relationship(
        "Folder",
        backref="parent",
        remote_side=[id],
        cascade="all, delete-orphan",
        single_parent=True
    )
