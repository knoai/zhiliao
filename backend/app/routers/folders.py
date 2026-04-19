from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import FolderCreate, FolderUpdate, FolderResponse, FolderSortUpdate
from app.services.folder_service import FolderService
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/folders", tags=["文件夹"])


@router.get("", response_model=List[FolderResponse])
async def get_folders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取文件夹列表"""
    folders = await FolderService.get_tree(db, current_user.id)
    return folders


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    data: FolderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """创建文件夹"""
    folder = await FolderService.create(db, current_user.id, data)
    return folder


@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取文件夹详情"""
    folder = await FolderService.get_by_id(db, current_user.id, folder_id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件夹不存在"
        )
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: UUID,
    data: FolderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新文件夹"""
    folder = await FolderService.update(db, current_user.id, folder_id, data)
    return folder


@router.patch("/{folder_id}/sort", response_model=FolderResponse)
async def update_folder_sort(
    folder_id: UUID,
    data: FolderSortUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新文件夹排序"""
    folder = await FolderService.update_sort(
        db, current_user.id, folder_id, data.sort_order, data.parent_id
    )
    return folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """删除文件夹"""
    await FolderService.delete(db, current_user.id, folder_id)
    return None


from fastapi import HTTPException
