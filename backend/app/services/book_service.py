from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, asc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models import Book, Chapter
from app.schemas import BookCreate, BookUpdate, ChapterCreate, ChapterUpdate


class BookService:
    # 默认的空 Slate 内容
    DEFAULT_CONTENT = [{
        "type": "paragraph",
        "children": [{"text": ""}]
    }]
    
    @staticmethod
    def _calc_word_count(content: list) -> int:
        """计算字数"""
        if not content:
            return 0
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
        import re
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        english_words = len(re.findall(r'[a-zA-Z]+', text))
        return chinese_chars + english_words
    
    # ==================== Book Methods ====================
    
    @staticmethod
    async def create_book(db: AsyncSession, user_id: UUID, data: BookCreate) -> Book:
        """创建书籍"""
        book = Book(
            user_id=user_id,
            title=data.title,
            description=data.description,
            cover_image=data.cover_image,
            visibility=data.visibility
        )
        
        db.add(book)
        await db.commit()
        await db.refresh(book)
        
        return book
    
    @staticmethod
    async def get_book_by_id(db: AsyncSession, user_id: UUID, book_id: UUID) -> Optional[Book]:
        """根据ID获取书籍"""
        result = await db.execute(
            select(Book).where(
                and_(
                    Book.id == book_id,
                    Book.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_book_list(
        db: AsyncSession,
        user_id: UUID,
        status: Optional[str] = None,
        keyword: Optional[str] = None
    ) -> list[Book]:
        """获取书籍列表"""
        query = select(Book).where(Book.user_id == user_id)
        
        if status:
            query = query.where(Book.status == status)
        
        if keyword:
            query = query.where(
                and_(
                    Book.title.ilike(f"%{keyword}%"),
                    Book.description.ilike(f"%{keyword}%")
                )
            )
        
        query = query.order_by(desc(Book.updated_at))
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_book(
        db: AsyncSession,
        user_id: UUID,
        book_id: UUID,
        data: BookUpdate
    ) -> Book:
        """更新书籍"""
        book = await BookService.get_book_by_id(db, user_id, book_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="书籍不存在"
            )
        
        if data.title is not None:
            book.title = data.title
        if data.description is not None:
            book.description = data.description
        if data.cover_image is not None:
            book.cover_image = data.cover_image
        if data.visibility is not None:
            book.visibility = data.visibility
        if data.status is not None:
            book.status = data.status
            if data.status == "published":
                book.published_at = datetime.utcnow()
            else:
                book.published_at = None
        
        await db.commit()
        await db.refresh(book)
        
        return book
    
    @staticmethod
    async def delete_book(db: AsyncSession, user_id: UUID, book_id: UUID) -> None:
        """删除书籍（级联删除章节）"""
        book = await BookService.get_book_by_id(db, user_id, book_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="书籍不存在"
            )
        
        await db.delete(book)
        await db.commit()
    
    @staticmethod
    async def update_book_word_count(db: AsyncSession, book_id: UUID) -> None:
        """更新书籍字数统计"""
        result = await db.execute(
            select(Chapter).where(
                and_(Chapter.book_id == book_id, Chapter.content.isnot(None))
            )
        )
        chapters = result.scalars().all()
        
        total_words = sum(
            BookService._calc_word_count(ch.content) 
            for ch in chapters if ch.content
        )
        
        result = await db.execute(
            select(Book).where(Book.id == book_id)
        )
        book = result.scalar_one_or_none()
        if book:
            book.word_count = total_words
            await db.commit()
    
    # ==================== Chapter Methods ====================
    
    @staticmethod
    async def create_chapter(
        db: AsyncSession,
        user_id: UUID,
        book_id: UUID,
        data: ChapterCreate
    ) -> Chapter:
        """创建章节"""
        # 验证书籍
        book = await BookService.get_book_by_id(db, user_id, book_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="书籍不存在"
            )
        
        # 计算深度和路径
        depth = 0
        path = ""
        if data.parent_id:
            result = await db.execute(
                select(Chapter).where(
                    and_(
                        Chapter.id == data.parent_id,
                        Chapter.book_id == book_id
                    )
                )
            )
            parent = result.scalar_one_or_none()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="父章节不存在"
                )
            depth = parent.depth + 1
            path = f"{parent.path}.{parent.id}" if parent.path else str(parent.id)
        
        # 获取当前层级下的最大排序值
        result = await db.execute(
            select(func.max(Chapter.sort_order)).where(
                and_(
                    Chapter.book_id == book_id,
                    Chapter.parent_id == data.parent_id
                )
            )
        )
        max_sort = result.scalar() or 0
        
        content = data.content if data.content else None
        
        chapter = Chapter(
            book_id=book_id,
            user_id=user_id,
            parent_id=data.parent_id,
            path=path,
            depth=depth,
            title=data.title,
            content=content,
            sort_order=max_sort + 1
        )
        
        db.add(chapter)
        await db.commit()
        await db.refresh(chapter)
        
        # 更新书籍字数
        if content:
            await BookService.update_book_word_count(db, book_id)
        
        return chapter
    
    @staticmethod
    async def get_chapter_by_id(
        db: AsyncSession,
        user_id: UUID,
        chapter_id: UUID
    ) -> Optional[Chapter]:
        """根据ID获取章节"""
        result = await db.execute(
            select(Chapter).where(
                and_(
                    Chapter.id == chapter_id,
                    Chapter.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_chapter_tree(
        db: AsyncSession,
        user_id: UUID,
        book_id: UUID
    ) -> list[dict]:
        """获取章节的树形结构，返回纯字典避免 ORM 懒加载问题"""
        # 获取所有章节
        result = await db.execute(
            select(Chapter)
            .where(Chapter.book_id == book_id)
            .order_by(asc(Chapter.sort_order))
        )
        chapters = result.scalars().all()
        
        # 转换为字典，避免 ORM 关系问题
        def chapter_to_dict(ch: Chapter) -> dict:
            return {
                "id": str(ch.id),
                "book_id": str(ch.book_id),
                "parent_id": str(ch.parent_id) if ch.parent_id else None,
                "title": ch.title,
                "path": ch.path,
                "depth": ch.depth,
                "sort_order": ch.sort_order,
                "has_content": ch.content is not None and len(ch.content) > 0 if ch.content else False,
                "children": [],
                "created_at": ch.created_at,
                "updated_at": ch.updated_at
            }
        
        # 构建章节映射
        chapter_map = {str(ch.id): chapter_to_dict(ch) for ch in chapters}
        root_chapters = []
        
        # 构建树形结构
        for ch in chapters:
            ch_dict = chapter_map[str(ch.id)]
            if ch.parent_id is None:
                root_chapters.append(ch_dict)
            else:
                parent_id = str(ch.parent_id)
                if parent_id in chapter_map:
                    chapter_map[parent_id]["children"].append(ch_dict)
        
        return root_chapters
    
    @staticmethod
    async def update_chapter(
        db: AsyncSession,
        user_id: UUID,
        chapter_id: UUID,
        data: ChapterUpdate
    ) -> Chapter:
        """更新章节"""
        chapter = await BookService.get_chapter_by_id(db, user_id, chapter_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="章节不存在"
            )
        
        if data.title is not None:
            chapter.title = data.title
        
        if data.content is not None:
            chapter.content = data.content
            # 更新书籍字数
            await BookService.update_book_word_count(db, chapter.book_id)
        
        if data.parent_id is not None and data.parent_id != chapter.parent_id:
            # 移动章节
            await BookService._move_chapter(db, chapter, data.parent_id)
        
        await db.commit()
        await db.refresh(chapter)
        
        return chapter
    
    @staticmethod
    async def _move_chapter(
        db: AsyncSession,
        chapter: Chapter,
        new_parent_id: Optional[UUID]
    ) -> None:
        """移动章节到新父节点"""
        # 检查循环引用
        if new_parent_id:
            current = new_parent_id
            while current:
                if current == chapter.id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="不能将章节移动到其子章节下"
                    )
                result = await db.execute(
                    select(Chapter.parent_id).where(Chapter.id == current)
                )
                current = result.scalar()
        
        # 更新父节点和路径
        chapter.parent_id = new_parent_id
        
        if new_parent_id:
            result = await db.execute(
                select(Chapter).where(Chapter.id == new_parent_id)
            )
            parent = result.scalar_one()
            chapter.depth = parent.depth + 1
            chapter.path = f"{parent.path}.{parent.id}" if parent.path else str(parent.id)
        else:
            chapter.depth = 0
            chapter.path = ""
        
        # 递归更新子章节的深度和路径
        await BookService._update_children_depth_and_path(db, chapter)
    
    @staticmethod
    async def _update_children_depth_and_path(db: AsyncSession, chapter: Chapter) -> None:
        """递归更新子章节的深度和路径"""
        result = await db.execute(
            select(Chapter).where(Chapter.parent_id == chapter.id)
        )
        children = result.scalars().all()
        
        for child in children:
            child.depth = chapter.depth + 1
            child.path = f"{chapter.path}.{chapter.id}" if chapter.path else str(chapter.id)
            await BookService._update_children_depth_and_path(db, child)
    
    @staticmethod
    async def update_chapter_sort(
        db: AsyncSession,
        user_id: UUID,
        chapter_id: UUID,
        sort_order: int,
        parent_id: Optional[UUID] = None
    ) -> Chapter:
        """更新章节排序"""
        chapter = await BookService.get_chapter_by_id(db, user_id, chapter_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="章节不存在"
            )
        
        chapter.sort_order = sort_order
        if parent_id is not None and parent_id != chapter.parent_id:
            await BookService._move_chapter(db, chapter, parent_id)
        
        await db.commit()
        await db.refresh(chapter)
        
        return chapter
    
    @staticmethod
    async def delete_chapter(db: AsyncSession, user_id: UUID, chapter_id: UUID) -> None:
        """删除章节（级联删除子章节）"""
        chapter = await BookService.get_chapter_by_id(db, user_id, chapter_id)
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="章节不存在"
            )
        
        book_id = chapter.book_id
        await db.delete(chapter)
        await db.commit()
        
        # 更新书籍字数
        await BookService.update_book_word_count(db, book_id)
