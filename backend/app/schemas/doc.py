from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID


# Slate JSON 类型
SlateNode = Dict[str, Any]


class DocBase(BaseModel):
    title: str = Field(default="无标题文档", max_length=500)


class DocCreate(DocBase):
    folder_id: Optional[UUID] = None
    content: Optional[List[SlateNode]] = None


class DocUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[List[SlateNode]] = None
    folder_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None  # draft, published


class DocStatusUpdate(BaseModel):
    status: str  # draft, published


class DocSortUpdate(BaseModel):
    sort_order: int
    folder_id: Optional[UUID] = None


class DocResponse(DocBase):
    id: UUID
    user_id: UUID
    folder_id: Optional[UUID] = None
    content: List[SlateNode]
    word_count: int
    tags: List[str]
    status: str
    published_at: Optional[datetime] = None
    version: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocListItem(BaseModel):
    """文档列表项（不含content）"""
    id: UUID
    title: str
    folder_id: Optional[UUID] = None
    word_count: int
    tags: List[str]
    status: str
    sort_order: int
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocVersionResponse(BaseModel):
    id: UUID
    doc_id: UUID
    content: List[SlateNode]
    word_count: int
    version: int
    created_at: datetime
    
    class Config:
        from_attributes = True
