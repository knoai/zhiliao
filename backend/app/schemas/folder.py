from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID


class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class FolderCreate(FolderBase):
    parent_id: Optional[UUID] = None


class FolderUpdate(FolderBase):
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = None


class FolderSortUpdate(BaseModel):
    sort_order: int
    parent_id: Optional[UUID] = None


class FolderResponse(FolderBase):
    id: UUID
    user_id: UUID
    parent_id: Optional[UUID] = None
    path: Optional[str] = None
    depth: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FolderTree(FolderResponse):
    """文件夹树形结构"""
    children: List["FolderTree"] = []
    doc_count: int = 0
