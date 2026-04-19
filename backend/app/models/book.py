import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, ForeignKey, Text, Integer, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Book(Base):
    """云书籍模型 - 类似GitBook/语雀知识库的结构化书籍"""
    __tablename__ = "books"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    # 书籍基本信息
    title: Mapped[str] = mapped_column(String(200), default="未命名书籍")
    description: Mapped[str] = mapped_column(Text, default="")
    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # 权限设置
    visibility: Mapped[str] = mapped_column(String(20), default="private")  # private/public
    
    # 排序和状态
    sort_order: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/published
    
    # 统计
    word_count: Mapped[int] = mapped_column(default=0)
    read_count: Mapped[int] = mapped_column(default=0)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # 关联
    user: Mapped["User"] = relationship("User", back_populates="books")
    chapters: Mapped[List["Chapter"]] = relationship("Chapter", back_populates="book", order_by="Chapter.sort_order")


class Chapter(Base):
    """章节模型 - 支持无限层级嵌套"""
    __tablename__ = "chapters"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    # 层级结构
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("chapters.id"), nullable=True)
    path: Mapped[str] = mapped_column(String(500), default="")  # 物化路径，如 "1.2.3"
    depth: Mapped[int] = mapped_column(default=0)  # 层级深度，0=根章节
    
    # 章节内容 - 使用JSON类型
    content: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # 排序
    sort_order: Mapped[int] = mapped_column(default=0)
    
    # 章节标题
    title: Mapped[str] = mapped_column(String(200), default="")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    book: Mapped["Book"] = relationship("Book", back_populates="chapters")
    user: Mapped["User"] = relationship("User", back_populates="chapters")
    parent: Mapped[Optional["Chapter"]] = relationship("Chapter", remote_side="Chapter.id", back_populates="children")
    children: Mapped[List["Chapter"]] = relationship("Chapter", remote_side="Chapter.parent_id", back_populates="parent", order_by="Chapter.sort_order")
