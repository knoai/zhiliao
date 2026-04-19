from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import UserResponse
from app.services.feishu_service import FeishuAuthService, FeishuBindingService
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/feishu", tags=["飞书集成"])


@router.get("/auth-url")
async def get_feishu_auth_url(
    current_user: User = Depends(get_current_active_user),
):
    """获取飞书授权页 URL"""
    return {"auth_url": FeishuAuthService.get_auth_url()}


@router.post("/callback")
async def feishu_callback(
    code: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """飞书 OAuth 回调：用 code 换 token 并保存绑定关系"""
    token_info = await FeishuAuthService.exchange_code_for_token(code)
    binding = await FeishuBindingService.save_binding(db, current_user.id, token_info)
    return {
        "message": "飞书账号绑定成功",
        "feishu_user_name": binding.feishu_user_name,
        "feishu_avatar": binding.feishu_avatar,
    }


@router.get("/binding")
async def get_feishu_binding(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的飞书绑定状态"""
    binding = await FeishuBindingService.get_binding(db, current_user.id)
    if not binding:
        return {"bound": False}
    return {
        "bound": True,
        "feishu_user_name": binding.feishu_user_name,
        "feishu_avatar": binding.feishu_avatar,
        "created_at": binding.created_at,
    }


@router.delete("/binding", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feishu_binding(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """解绑飞书账号"""
    await FeishuBindingService.delete_binding(db, current_user.id)
    return None
