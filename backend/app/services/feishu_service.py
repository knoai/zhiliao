import uuid
import base64
import httpx
from datetime import datetime, timedelta
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.config import get_settings
from app.models import FeishuBinding

settings = get_settings()


def _get_fernet() -> Fernet:
    key = settings.FEISHU_TOKEN_ENCRYPTION_KEY
    # 确保 key 是 32 字节，用于 Fernet
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"feishu-cloud-notes-salt",
        iterations=100000,
    )
    kdf.update(key.encode())
    derived = base64.urlsafe_b64encode(kdf.finalize())
    return Fernet(derived)


def encrypt_token(token: str) -> str:
    return _get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()


class FeishuAuthService:
    BASE_URL = "https://open.feishu.cn/open-apis"

    @staticmethod
    def get_auth_url() -> str:
        if not settings.FEISHU_APP_ID:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="飞书应用未配置"
            )
        return (
            f"{FeishuAuthService.BASE_URL}/authen/v1/index"
            f"?app_id={settings.FEISHU_APP_ID}"
            f"&redirect_uri={settings.FEISHU_REDIRECT_URI}"
        )

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        if not settings.FEISHU_APP_ID or not settings.FEISHU_APP_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="飞书应用未配置"
            )

        async with httpx.AsyncClient() as client:
            # 1. 获取 app_access_token
            app_resp = await client.post(
                f"{FeishuAuthService.BASE_URL}/auth/v3/app_access_token/internal",
                json={
                    "app_id": settings.FEISHU_APP_ID,
                    "app_secret": settings.FEISHU_APP_SECRET,
                },
            )
            app_data = app_resp.json()
            if app_data.get("code") != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"获取 app_access_token 失败: {app_data}"
                )
            app_access_token = app_data["app_access_token"]

            # 2. 用 code 换取 user_access_token
            token_resp = await client.post(
                f"{FeishuAuthService.BASE_URL}/authen/v1/access_token",
                headers={"Authorization": f"Bearer {app_access_token}"},
                json={
                    "grant_type": "authorization_code",
                    "code": code,
                },
            )
            token_data = token_resp.json()
            if token_data.get("code") != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"换取 access_token 失败: {token_data}"
                )

        data = token_data["data"]
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_in": data["expires_in"],
            "open_id": data.get("open_id"),
            "union_id": data.get("union_id"),
            "name": data.get("name"),
            "avatar_url": data.get("avatar_url"),
            "en_name": data.get("en_name"),
        }

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        if not settings.FEISHU_APP_ID or not settings.FEISHU_APP_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="飞书应用未配置"
            )

        async with httpx.AsyncClient() as client:
            app_resp = await client.post(
                f"{FeishuAuthService.BASE_URL}/auth/v3/app_access_token/internal",
                json={
                    "app_id": settings.FEISHU_APP_ID,
                    "app_secret": settings.FEISHU_APP_SECRET,
                },
            )
            app_data = app_resp.json()
            if app_data.get("code") != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"获取 app_access_token 失败: {app_data}"
                )
            app_access_token = app_data["app_access_token"]

            refresh_resp = await client.post(
                f"{FeishuAuthService.BASE_URL}/authen/v1/refresh_access_token",
                headers={"Authorization": f"Bearer {app_access_token}"},
                json={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            refresh_data = refresh_resp.json()
            if refresh_data.get("code") != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"刷新 access_token 失败: {refresh_data}"
                )

        data = refresh_data["data"]
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token"),
            "expires_in": data["expires_in"],
        }


class FeishuBindingService:
    @staticmethod
    async def get_binding(db: AsyncSession, user_id: uuid.UUID) -> Optional[FeishuBinding]:
        result = await db.execute(
            select(FeishuBinding).where(FeishuBinding.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def save_binding(
        db: AsyncSession,
        user_id: uuid.UUID,
        token_info: dict,
    ) -> FeishuBinding:
        binding = await FeishuBindingService.get_binding(db, user_id)
        encrypted_access = encrypt_token(token_info["access_token"])
        encrypted_refresh = encrypt_token(token_info["refresh_token"]) if token_info.get("refresh_token") else None
        expires_at = datetime.utcnow() + timedelta(seconds=token_info["expires_in"])

        if binding:
            binding.access_token = encrypted_access
            binding.refresh_token = encrypted_refresh
            binding.expires_at = expires_at
            binding.feishu_user_name = token_info.get("name") or binding.feishu_user_name
            binding.feishu_avatar = token_info.get("avatar_url") or binding.feishu_avatar
            binding.is_active = True
        else:
            binding = FeishuBinding(
                user_id=user_id,
                feishu_open_id=token_info["open_id"],
                feishu_union_id=token_info.get("union_id"),
                feishu_user_name=token_info.get("name"),
                feishu_avatar=token_info.get("avatar_url"),
                access_token=encrypted_access,
                refresh_token=encrypted_refresh,
                expires_at=expires_at,
                is_active=True,
            )
            db.add(binding)

        await db.commit()
        await db.refresh(binding)
        return binding

    @staticmethod
    async def delete_binding(db: AsyncSession, user_id: uuid.UUID) -> None:
        binding = await FeishuBindingService.get_binding(db, user_id)
        if binding:
            await db.delete(binding)
            await db.commit()

    @staticmethod
    async def get_valid_access_token(db: AsyncSession, user_id: uuid.UUID) -> str:
        binding = await FeishuBindingService.get_binding(db, user_id)
        if not binding or not binding.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="飞书账号未绑定或已解绑"
            )

        # 如果 10 分钟内过期，自动刷新
        if binding.expires_at <= datetime.utcnow() + timedelta(minutes=10):
            if not binding.refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="飞书授权已过期，请重新绑定"
                )
            refresh_info = await FeishuAuthService.refresh_access_token(
                decrypt_token(binding.refresh_token)
            )
            binding.access_token = encrypt_token(refresh_info["access_token"])
            if refresh_info.get("refresh_token"):
                binding.refresh_token = encrypt_token(refresh_info["refresh_token"])
            binding.expires_at = datetime.utcnow() + timedelta(seconds=refresh_info["expires_in"])
            await db.commit()
            await db.refresh(binding)

        return decrypt_token(binding.access_token)
