import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models import User
from app.schemas import UserCreate, UserLogin
from app.utils.auth import get_password_hash, verify_password, create_access_token


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, user_data: UserCreate) -> User:
        """用户注册 - 新用户默认需要审核"""
        # 检查邮箱是否已存在
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册"
            )
        
        # 检查是否为第一个用户（自动设为超管且已审核）
        result = await db.execute(select(User))
        is_first_user = result.scalar_one_or_none() is None
        
        # 创建新用户
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=get_password_hash(user_data.password),
            is_admin=is_first_user,  # 第一个用户自动设为管理员
            is_superadmin=is_first_user,  # 第一个用户自动设为超管
            is_approved=is_first_user,  # 第一个用户自动通过审核
            approved_at=datetime.utcnow() if is_first_user else None
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def login(db: AsyncSession, login_data: UserLogin) -> tuple[User, str]:
        """用户登录 - 检查审核状态"""
        result = await db.execute(
            select(User).where(User.email == login_data.email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="该邮箱尚未注册"
            )
        
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="密码错误，请重新输入"
            )
        
        # 检查用户是否已通过审核
        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="账号正在审核中，请等待管理员审核通过后再登录"
            )
        
        token = create_access_token(str(user.id))
        return user, token
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
        """通过ID获取用户"""
        result = await db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_list(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        pending_only: bool = False
    ) -> tuple[list[User], int]:
        """获取用户列表"""
        query = select(User)
        
        if pending_only:
            query = query.where(User.is_approved == False)
        
        # 获取总数
        count_result = await db.execute(query)
        total = len(count_result.scalars().all())
        
        # 获取分页数据
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        users = result.scalars().all()
        
        return users, total
    
    @staticmethod
    async def approve_user(
        db: AsyncSession,
        user_id: str,
        approved_by: str,
        approve: bool = True
    ) -> User:
        """审核用户"""
        result = await db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        if user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="不能审核超管账号"
            )
        
        if approve:
            user.is_approved = True
            user.approved_at = datetime.utcnow()
            user.approved_by = uuid.UUID(approved_by)
        else:
            # 拒绝审核则删除用户
            await db.delete(user)
        
        await db.commit()
        if approve:
            await db.refresh(user)
        
        return user
    
    @staticmethod
    async def set_user_admin(
        db: AsyncSession,
        user_id: str,
        is_admin: bool
    ) -> User:
        """设置用户管理员权限"""
        result = await db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        if user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="不能修改超管的管理员权限"
            )
        
        user.is_admin = is_admin
        await db.commit()
        await db.refresh(user)
        
        return user
