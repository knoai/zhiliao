from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import (
    DocCreate, DocUpdate, DocResponse, 
    DocListItem, DocVersionResponse, DocStatusUpdate, DocSortUpdate,
    PublicDocListItem, PublicDocResponse
)
from app.services.doc_service import DocService
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/docs", tags=["文档"])


# ==================== Public Routes ====================

@router.get("/public", response_model=List[PublicDocListItem])
async def get_public_docs(
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    db: AsyncSession = Depends(get_db)
):
    """获取公开文档列表（无需登录）"""
    from sqlalchemy import select
    
    docs = await DocService.get_public_list(db, keyword=keyword)
    
    # 获取作者信息
    result = await db.execute(select(User))
    users = {u.id: u.username for u in result.scalars().all()}
    
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "folder_id": doc.folder_id,
            "word_count": doc.word_count,
            "tags": doc.tags,
            "status": doc.status,
            "visibility": doc.visibility,
            "sort_order": doc.sort_order,
            "updated_at": doc.updated_at,
            "author_name": users.get(doc.user_id, "未知作者")
        }
        for doc in docs
    ]


@router.get("/public/{doc_id}", response_model=PublicDocResponse)
async def get_public_doc(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """获取公开文档详情（无需登录）"""
    from sqlalchemy import select
    
    doc = await DocService.get_public_by_id(db, doc_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在或未公开"
        )
    
    # 获取作者名
    result = await db.execute(select(User).where(User.id == doc.user_id))
    user = result.scalar_one_or_none()
    author_name = user.username if user else "未知作者"
    
    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "folder_id": doc.folder_id,
        "title": doc.title,
        "content": doc.content,
        "word_count": doc.word_count,
        "tags": doc.tags,
        "status": doc.status,
        "visibility": doc.visibility,
        "published_at": doc.published_at,
        "version": doc.version,
        "sort_order": doc.sort_order,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "author_name": author_name
    }


# ==================== Private Routes ====================

@router.get("", response_model=List[DocListItem])
async def get_docs(
    folder_id: Optional[UUID] = None,
    status: Optional[str] = Query(None, description="状态: draft/published"),
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取文档列表"""
    docs = await DocService.get_list(
        db, current_user.id, folder_id=folder_id, status=status, keyword=keyword
    )
    return docs


@router.post("", response_model=DocResponse, status_code=status.HTTP_201_CREATED)
async def create_doc(
    data: DocCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """创建文档"""
    doc = await DocService.create(db, current_user.id, data)
    return doc


@router.get("/{doc_id}", response_model=DocResponse)
async def get_doc(
    doc_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取文档详情"""
    doc = await DocService.get_by_id(db, current_user.id, doc_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    return doc


@router.put("/{doc_id}", response_model=DocResponse)
async def update_doc(
    doc_id: UUID,
    data: DocUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新文档（自动保存）"""
    doc = await DocService.update(db, current_user.id, doc_id, data)
    return doc


@router.patch("/{doc_id}/status", response_model=DocResponse)
async def update_doc_status(
    doc_id: UUID,
    data: DocStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新文档状态（发布/草稿）"""
    doc = await DocService.update(db, current_user.id, doc_id, DocUpdate(status=data.status))
    return doc


@router.patch("/{doc_id}/sort", response_model=DocResponse)
async def update_doc_sort(
    doc_id: UUID,
    data: DocSortUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新文档排序"""
    doc = await DocService.update_sort(
        db, current_user.id, doc_id, data.sort_order, data.folder_id
    )
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doc(
    doc_id: UUID,
    hard: bool = Query(False, description="是否硬删除"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """删除文档"""
    await DocService.delete(db, current_user.id, doc_id, hard=hard)
    return None


@router.post("/{doc_id}/restore", response_model=DocResponse)
async def restore_doc(
    doc_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """恢复已删除文档"""
    doc = await DocService.restore(db, current_user.id, doc_id)
    return doc


@router.get("/{doc_id}/versions", response_model=List[DocVersionResponse])
async def get_doc_versions(
    doc_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取文档版本历史"""
    versions = await DocService.get_versions(db, current_user.id, doc_id)
    return versions


from fastapi import HTTPException
