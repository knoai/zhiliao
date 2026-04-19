from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.database import get_db
from app.models import User, Doc, Book
from app.schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    UserApprovalRequest, UserApprovalResponse, 
    UserListResponse, UserListItem, ApprovalStatusResponse
)
from app.services.auth_service import AuthService
from app.utils.auth import get_current_active_user
from app.utils.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["认证"])


# 依赖：获取当前管理员用户
async def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """检查当前用户是否为管理员"""
    if not current_user.is_admin and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user


# 依赖：获取当前超管用户
async def get_current_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """检查当前用户是否为超管"""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要超管权限"
        )
    return current_user


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """用户注册 - 新用户需要等待审核"""
    user = await AuthService.register(db, user_data)
    
    # 如果是第一个用户（超管），直接返回token
    if user.is_superadmin:
        token = create_access_token(str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }
    
    # 非超管用户注册后需要等待审核
    raise HTTPException(
        status_code=status.HTTP_202_ACCEPTED,
        detail="注册成功，请等待管理员审核通过后再登录"
    )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """用户登录"""
    user, token = await AuthService.login(db, login_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """更新当前用户信息"""
    if "username" in user_update:
        current_user.username = user_update["username"]
    if "avatar" in user_update:
        current_user.avatar = user_update["avatar"]
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ==================== 管理员API ====================

@router.get("/admin/users", response_model=UserListResponse)
async def get_user_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    pending_only: bool = Query(False, description="仅显示待审核用户"),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取用户列表（管理员权限）"""
    users, total = await AuthService.get_user_list(db, skip, limit, pending_only)
    return {
        "total": total,
        "items": users
    }


@router.post("/admin/users/{user_id}/approve", response_model=UserApprovalResponse)
async def approve_user(
    user_id: str,
    approval_data: UserApprovalRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """审核用户（管理员权限）"""
    user = await AuthService.approve_user(
        db, 
        user_id, 
        str(current_user.id),
        approval_data.approve
    )
    
    action = "通过" if approval_data.approve else "拒绝"
    return {
        "message": f"已{action}用户 {user.username} 的注册申请",
        "user": user
    }


@router.post("/admin/users/{user_id}/set-admin", response_model=UserResponse)
async def set_user_admin(
    user_id: str,
    is_admin: bool = True,
    current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """设置用户管理员权限（仅超管）"""
    user = await AuthService.set_user_admin(db, user_id, is_admin)
    return user


@router.get("/admin/pending-count", response_model=dict)
async def get_pending_count(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取待审核用户数量"""
    from sqlalchemy import func
    from sqlalchemy import select
    
    result = await db.execute(
        select(func.count()).select_from(User).where(User.is_approved == False)
    )
    count = result.scalar()
    
    return {"pending_count": count}


@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户的内容统计数据"""
    # 文档统计
    doc_count_result = await db.execute(
        select(func.count()).select_from(Doc).where(Doc.user_id == current_user.id)
    )
    doc_count = doc_count_result.scalar() or 0
    
    published_doc_count_result = await db.execute(
        select(func.count()).select_from(Doc).where(
            Doc.user_id == current_user.id,
            Doc.status == "published"
        )
    )
    published_doc_count = published_doc_count_result.scalar() or 0
    
    doc_words_result = await db.execute(
        select(func.sum(Doc.word_count)).where(Doc.user_id == current_user.id)
    )
    doc_words = doc_words_result.scalar() or 0
    
    # 书籍统计
    book_count_result = await db.execute(
        select(func.count()).select_from(Book).where(Book.user_id == current_user.id)
    )
    book_count = book_count_result.scalar() or 0
    
    book_words_result = await db.execute(
        select(func.sum(Book.word_count)).where(Book.user_id == current_user.id)
    )
    book_words = book_words_result.scalar() or 0
    
    total_word_count = doc_words + book_words
    
    return {
        "doc_count": doc_count,
        "book_count": book_count,
        "published_doc_count": published_doc_count,
        "total_word_count": total_word_count,
    }
