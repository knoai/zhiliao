from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, asc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models import Folder, Doc
from app.schemas import FolderCreate, FolderUpdate


class FolderService:
    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, data: FolderCreate) -> Folder:
        """创建文件夹"""
        # 验证父文件夹
        depth = 0
        if data.parent_id:
            parent = await FolderService.get_by_id(db, user_id, data.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="父文件夹不存在"
                )
            depth = parent.depth + 1
            path = f"{parent.path or str(parent.id)}.{data.parent_id}"
        else:
            path = str(user_id)  # 根级路径
        
        # 获取当前层级下的最大排序值
        result = await db.execute(
            select(func.max(Folder.sort_order)).where(
                and_(
                    Folder.user_id == user_id,
                    Folder.parent_id == data.parent_id
                )
            )
        )
        max_sort = result.scalar() or 0
        
        folder = Folder(
            name=data.name,
            user_id=user_id,
            parent_id=data.parent_id,
            path=path,
            depth=depth,
            sort_order=max_sort + 1
        )
        
        db.add(folder)
        await db.commit()
        await db.refresh(folder)
        
        return folder
    
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: UUID, folder_id: UUID) -> Optional[Folder]:
        """根据ID获取文件夹"""
        result = await db.execute(
            select(Folder).where(
                and_(Folder.id == folder_id, Folder.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_tree(db: AsyncSession, user_id: UUID) -> list[Folder]:
        """获取用户的文件夹树"""
        result = await db.execute(
            select(Folder).where(Folder.user_id == user_id)
            .order_by(asc(Folder.sort_order), Folder.created_at)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update(
        db: AsyncSession, 
        user_id: UUID, 
        folder_id: UUID, 
        data: FolderUpdate
    ) -> Folder:
        """更新文件夹"""
        folder = await FolderService.get_by_id(db, user_id, folder_id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件夹不存在"
            )
        
        if data.name is not None:
            folder.name = data.name
        
        if data.sort_order is not None:
            folder.sort_order = data.sort_order
        
        # 如果移动父文件夹，需要更新 path 和 depth
        if data.parent_id is not None and data.parent_id != folder.parent_id:
            if data.parent_id:
                parent = await FolderService.get_by_id(db, user_id, data.parent_id)
                if not parent:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="父文件夹不存在"
                    )
                # 检查是否将自己移动到自己的子文件夹中
                if parent.path and str(folder_id) in parent.path:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="不能将文件夹移动到自己的子文件夹中"
                    )
                folder.depth = parent.depth + 1
                folder.path = f"{parent.path or str(parent.id)}.{data.parent_id}"
            else:
                folder.depth = 0
                folder.path = str(user_id)
            
            folder.parent_id = data.parent_id
            
            # 递归更新所有子文件夹的 path 和 depth
            await FolderService._update_children_path(db, folder)
        
        await db.commit()
        await db.refresh(folder)
        
        return folder
    
    @staticmethod
    async def _update_children_path(db: AsyncSession, folder: Folder):
        """递归更新子文件夹的 path 和 depth"""
        result = await db.execute(
            select(Folder).where(Folder.parent_id == folder.id)
        )
        children = result.scalars().all()
        
        for child in children:
            child.depth = folder.depth + 1
            child.path = f"{folder.path}.{folder.id}"
            await FolderService._update_children_path(db, child)
    
    @staticmethod
    async def update_sort(
        db: AsyncSession,
        user_id: UUID,
        folder_id: UUID,
        sort_order: int,
        parent_id: Optional[UUID] = None
    ) -> Folder:
        """更新文件夹排序"""
        folder = await FolderService.get_by_id(db, user_id, folder_id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件夹不存在"
            )
        
        folder.sort_order = sort_order
        if parent_id is not None and parent_id != folder.parent_id:
            # 移动到其他父文件夹
            if parent_id:
                parent = await FolderService.get_by_id(db, user_id, parent_id)
                if parent:
                    folder.depth = parent.depth + 1
                    folder.path = f"{parent.path or str(parent.id)}.{parent_id}"
            else:
                folder.depth = 0
                folder.path = str(user_id)
            folder.parent_id = parent_id
        
        await db.commit()
        await db.refresh(folder)
        
        return folder
    
    @staticmethod
    async def delete(db: AsyncSession, user_id: UUID, folder_id: UUID) -> None:
        """删除文件夹（及子文件夹和文档）"""
        folder = await FolderService.get_by_id(db, user_id, folder_id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件夹不存在"
            )
        
        await db.delete(folder)
        await db.commit()
