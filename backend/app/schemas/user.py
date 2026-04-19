from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=1, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    avatar: Optional[str] = None
    is_admin: bool = False
    is_superadmin: bool = False
    is_approved: bool = False
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# 管理员相关Schema
class UserApprovalRequest(BaseModel):
    user_id: UUID
    approve: bool = True  # True为通过，False为拒绝


class UserApprovalResponse(BaseModel):
    message: str
    user: UserResponse


class UserListItem(UserResponse):
    """用户列表项"""
    approved_by: Optional[UUID] = None


class UserListResponse(BaseModel):
    total: int
    items: list[UserListItem]


class ApprovalStatusResponse(BaseModel):
    """审核状态响应"""
    is_approved: bool
    message: str
