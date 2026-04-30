from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models import Doc, DocVersion, Folder
from app.schemas import DocCreate, DocUpdate


class DocService:
    # 默认的空 Slate 内容
    DEFAULT_CONTENT = [{
        "type": "paragraph",
        "children": [{"text": ""}]
    }]
    
    @staticmethod
    def _calc_word_count(content: list) -> int:
        """计算字数"""
        text = ""
        def extract_text(node):
            nonlocal text
            if isinstance(node, dict):
                if "text" in node:
                    text += node["text"]
                if "children" in node:
                    for child in node["children"]:
                        extract_text(child)
            elif isinstance(node, list):
                for item in node:
                    extract_text(item)
        
        extract_text(content)
        # 简单统计中文字符和英文单词
        import re
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        english_words = len(re.findall(r'[a-zA-Z]+', text))
        return chinese_chars + english_words
    
    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, data: DocCreate) -> Doc:
        """创建文档"""
        # 验证文件夹
        if data.folder_id:
            result = await db.execute(
                select(Folder).where(
                    and_(Folder.id == data.folder_id, Folder.user_id == user_id)
                )
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="文件夹不存在"
                )
        
        content = data.content or DocService.DEFAULT_CONTENT
        word_count = DocService._calc_word_count(content)
        
        # 获取当前文件夹下的最大排序值
        result = await db.execute(
            select(func.max(Doc.sort_order)).where(
                and_(Doc.user_id == user_id, Doc.folder_id == data.folder_id)
            )
        )
        max_sort = result.scalar() or 0
        
        doc = Doc(
            user_id=user_id,
            folder_id=data.folder_id,
            title=data.title,
            content=content,
            word_count=word_count,
            sort_order=max_sort + 1,
            visibility=data.visibility
        )
        
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        return doc
    
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: UUID, doc_id: UUID) -> Optional[Doc]:
        """根据ID获取文档"""
        result = await db.execute(
            select(Doc).where(
                and_(
                    Doc.id == doc_id,
                    Doc.user_id == user_id,
                    Doc.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_list(
        db: AsyncSession, 
        user_id: UUID,
        folder_id: Optional[UUID] = None,
        status: Optional[str] = None,
        keyword: Optional[str] = None,
        include_deleted: bool = False
    ) -> list[Doc]:
        """获取文档列表"""
        query = select(Doc).where(Doc.user_id == user_id)
        
        if not include_deleted:
            query = query.where(Doc.is_deleted == False)
        
        if folder_id:
            query = query.where(Doc.folder_id == folder_id)
        
        if status:
            query = query.where(Doc.status == status)
        
        if keyword:
            query = query.where(
                or_(
                    Doc.title.ilike(f"%{keyword}%"),
                    Doc.tags.contains([keyword])
                )
            )
        
        query = query.order_by(asc(Doc.sort_order), desc(Doc.updated_at))
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update(
        db: AsyncSession,
        user_id: UUID,
        doc_id: UUID,
        data: DocUpdate
    ) -> Doc:
        """更新文档"""
        doc = await DocService.get_by_id(db, user_id, doc_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文档不存在"
            )
        
        # 更新内容
        if data.content is not None:
            doc.content = data.content
            doc.word_count = DocService._calc_word_count(data.content)
            doc.version += 1
            
            # 创建版本快照
            version = DocVersion(
                doc_id=doc.id,
                content=doc.content,
                word_count=doc.word_count,
                version=doc.version
            )
            db.add(version)
        
        if data.title is not None:
            doc.title = data.title
        
        if data.folder_id is not None:
            doc.folder_id = data.folder_id
        
        if data.tags is not None:
            doc.tags = data.tags
        
        if data.status is not None:
            doc.status = data.status
            if data.status == "published":
                doc.published_at = datetime.utcnow()
            else:
                doc.published_at = None
        
        if data.visibility is not None:
            doc.visibility = data.visibility
        
        await db.commit()
        await db.refresh(doc)
        
        return doc
    
    @staticmethod
    async def update_sort(
        db: AsyncSession,
        user_id: UUID,
        doc_id: UUID,
        sort_order: int,
        folder_id: Optional[UUID] = None
    ) -> Doc:
        """更新文档排序"""
        doc = await DocService.get_by_id(db, user_id, doc_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文档不存在"
            )
        
        doc.sort_order = sort_order
        if folder_id is not None:
            doc.folder_id = folder_id
        
        await db.commit()
        await db.refresh(doc)
        
        return doc
    
    @staticmethod
    async def delete(db: AsyncSession, user_id: UUID, doc_id: UUID, hard: bool = False) -> None:
        """删除文档"""
        doc = await DocService.get_by_id(db, user_id, doc_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文档不存在"
            )
        
        if hard:
            await db.delete(doc)
        else:
            doc.is_deleted = True
            doc.deleted_at = datetime.utcnow()
        
        await db.commit()
    
    @staticmethod
    async def restore(db: AsyncSession, user_id: UUID, doc_id: UUID) -> Doc:
        """恢复已删除文档"""
        result = await db.execute(
            select(Doc).where(
                and_(
                    Doc.id == doc_id,
                    Doc.user_id == user_id,
                    Doc.is_deleted == True
                )
            )
        )
        doc = result.scalar_one_or_none()
        
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文档不存在或未被删除"
            )
        
        doc.is_deleted = False
        doc.deleted_at = None
        
        await db.commit()
        await db.refresh(doc)
        
        return doc
    
    @staticmethod
    async def get_public_list(
        db: AsyncSession,
        keyword: Optional[str] = None
    ) -> list[Doc]:
        """获取公开文档列表"""
        query = select(Doc).where(
            and_(Doc.visibility == "public", Doc.is_deleted == False)
        )
        
        if keyword:
            query = query.where(Doc.title.ilike(f"%{keyword}%"))
        
        query = query.order_by(desc(Doc.updated_at))
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_public_by_id(db: AsyncSession, doc_id: UUID) -> Optional[Doc]:
        """获取公开文档详情"""
        result = await db.execute(
            select(Doc).where(
                and_(
                    Doc.id == doc_id,
                    Doc.visibility == "public",
                    Doc.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_versions(db: AsyncSession, user_id: UUID, doc_id: UUID) -> list[DocVersion]:
        """获取文档版本历史"""
        doc = await DocService.get_by_id(db, user_id, doc_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文档不存在"
            )
        
        result = await db.execute(
            select(DocVersion)
            .where(DocVersion.doc_id == doc_id)
            .order_by(DocVersion.version.desc())
        )
        
        return list(result.scalars().all())
