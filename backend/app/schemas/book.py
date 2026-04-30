from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID


# Slate JSON 类型
SlateNode = Dict[str, Any]


# ==================== Book Schemas ====================

class BookBase(BaseModel):
    title: str = Field(default="未命名书籍", max_length=200)
    description: str = Field(default="")


class BookCreate(BookBase):
    cover_image: Optional[str] = None
    visibility: str = Field(default="private", pattern="^(private|public)$")


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    visibility: Optional[str] = Field(None, pattern="^(private|public)$")
    status: Optional[str] = Field(None, pattern="^(draft|published)$")


class BookListItem(BaseModel):
    """书籍列表项"""
    id: UUID
    title: str
    description: str
    cover_image: Optional[str] = None
    visibility: str
    status: str
    word_count: int
    read_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BookResponse(BookBase):
    """书籍详情"""
    id: UUID
    user_id: UUID
    cover_image: Optional[str] = None
    visibility: str
    status: str
    word_count: int
    read_count: int
    chapters: List["ChapterTree"] = []
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PublicBookListItem(BookListItem):
    """公开书籍列表项（含作者信息）"""
    author_name: str


class PublicBookResponse(BookBase):
    """公开书籍详情（含作者信息，不含敏感字段）"""
    id: UUID
    cover_image: Optional[str] = None
    visibility: str
    status: str
    word_count: int
    read_count: int
    chapters: List["ChapterTree"] = []
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    author_name: str


# ==================== Chapter Schemas ====================

class ChapterBase(BaseModel):
    title: str = Field(default="", max_length=200)


class ChapterCreate(ChapterBase):
    parent_id: Optional[UUID] = None
    content: Optional[List[SlateNode]] = None


class ChapterUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[List[SlateNode]] = None
    parent_id: Optional[UUID] = None


class ChapterSortUpdate(BaseModel):
    sort_order: int
    parent_id: Optional[UUID] = None


class ChapterTree(BaseModel):
    """章节树形结构"""
    id: UUID
    book_id: UUID
    parent_id: Optional[UUID] = None
    title: str
    path: str
    depth: int
    sort_order: int
    has_content: bool  # 是否有内容（目录章节为False）
    children: List["ChapterTree"] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChapterResponse(ChapterBase):
    """章节详情（含内容）"""
    id: UUID
    book_id: UUID
    parent_id: Optional[UUID] = None
    user_id: UUID
    path: str
    depth: int
    sort_order: int
    content: Optional[List[SlateNode]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# 解决循环引用
BookResponse.model_rebuild()
