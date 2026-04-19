from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import (
    BookCreate, BookUpdate, BookResponse, BookListItem,
    ChapterCreate, ChapterUpdate, ChapterResponse, ChapterTree, ChapterSortUpdate
)
from app.services.book_service import BookService
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/books", tags=["云书籍"])


# ==================== Book Routes ====================

@router.get("", response_model=List[BookListItem])
async def get_books(
    status: Optional[str] = Query(None, description="状态: draft/published"),
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取书籍列表"""
    books = await BookService.get_book_list(
        db, current_user.id, status=status, keyword=keyword
    )
    return books


@router.post("", response_model=BookListItem, status_code=status.HTTP_201_CREATED)
async def create_book(
    data: BookCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """创建书籍"""
    book = await BookService.create_book(db, current_user.id, data)
    return book


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取书籍详情（含章节树）"""
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select, and_
    from app.models import Book, Chapter
    
    # 获取书籍（不包含章节关系，避免懒加载问题）
    result = await db.execute(
        select(Book).where(
            and_(Book.id == book_id, Book.user_id == current_user.id)
        )
    )
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="书籍不存在"
        )
    
    # 获取章节树
    chapter_tree = await BookService.get_chapter_tree(db, current_user.id, book_id)
    
    # 手动构建响应
    return {
        "id": book.id,
        "user_id": book.user_id,
        "title": book.title,
        "description": book.description,
        "cover_image": book.cover_image,
        "visibility": book.visibility,
        "status": book.status,
        "word_count": book.word_count,
        "read_count": book.read_count,
        "chapters": chapter_tree,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
        "published_at": book.published_at
    }


@router.put("/{book_id}", response_model=BookListItem)
async def update_book(
    book_id: UUID,
    data: BookUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新书籍"""
    book = await BookService.update_book(db, current_user.id, book_id, data)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """删除书籍"""
    await BookService.delete_book(db, current_user.id, book_id)
    return None


# ==================== Chapter Routes ====================

@router.get("/{book_id}/chapters", response_model=List[ChapterTree])
async def get_chapters(
    book_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取书籍的章节树"""
    chapters = await BookService.get_chapter_tree(db, current_user.id, book_id)
    return chapters


@router.post("/{book_id}/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    book_id: UUID,
    data: ChapterCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """创建章节"""
    chapter = await BookService.create_chapter(db, current_user.id, book_id, data)
    return chapter


@router.get("/{book_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    book_id: UUID,
    chapter_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取章节详情"""
    chapter = await BookService.get_chapter_by_id(db, current_user.id, chapter_id)
    if not chapter or chapter.book_id != book_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="章节不存在"
        )
    return chapter


@router.put("/{book_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    book_id: UUID,
    chapter_id: UUID,
    data: ChapterUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新章节"""
    chapter = await BookService.get_chapter_by_id(db, current_user.id, chapter_id)
    if not chapter or chapter.book_id != book_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="章节不存在"
        )
    chapter = await BookService.update_chapter(db, current_user.id, chapter_id, data)
    return chapter


@router.patch("/{book_id}/chapters/{chapter_id}/sort", response_model=ChapterResponse)
async def update_chapter_sort(
    book_id: UUID,
    chapter_id: UUID,
    data: ChapterSortUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新章节排序"""
    chapter = await BookService.get_chapter_by_id(db, current_user.id, chapter_id)
    if not chapter or chapter.book_id != book_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="章节不存在"
        )
    chapter = await BookService.update_chapter_sort(
        db, current_user.id, chapter_id, data.sort_order, data.parent_id
    )
    return chapter


@router.delete("/{book_id}/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    book_id: UUID,
    chapter_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """删除章节"""
    chapter = await BookService.get_chapter_by_id(db, current_user.id, chapter_id)
    if not chapter or chapter.book_id != book_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="章节不存在"
        )
    await BookService.delete_chapter(db, current_user.id, chapter_id)
    return None


from fastapi import HTTPException
