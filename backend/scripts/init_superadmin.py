#!/usr/bin/env python3
"""
初始化超管账号脚本
默认超管: admin / password01!
"""

import asyncio
import sys
import os

# 添加backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User
from app.utils.auth import get_password_hash


# 默认超管配置
SUPERADMIN_EMAIL = "admin"
SUPERADMIN_USERNAME = "管理员"
SUPERADMIN_PASSWORD = "password01!"


async def init_superadmin():
    """初始化超管账号"""
    async with AsyncSessionLocal() as db:
        # 检查是否已存在超管
        result = await db.execute(
            select(User).where(User.is_superadmin == True)
        )
        existing_superadmin = result.scalar_one_or_none()
        
        if existing_superadmin:
            print(f"超管账号已存在: {existing_superadmin.email}")
            return
        
        # 检查是否已有用户名为 admin 的用户
        result = await db.execute(
            select(User).where(User.email == SUPERADMIN_EMAIL)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # 将现有 admin 用户提升为超管
            existing_user.is_admin = True
            existing_user.is_superadmin = True
            existing_user.is_approved = True
            existing_user.approved_at = datetime.utcnow()
            await db.commit()
            print(f"已将现有用户 {SUPERADMIN_EMAIL} 提升为超管")
            return
        
        # 创建新的超管账号
        superadmin = User(
            email=SUPERADMIN_EMAIL,
            username=SUPERADMIN_USERNAME,
            password_hash=get_password_hash(SUPERADMIN_PASSWORD),
            is_admin=True,
            is_superadmin=True,
            is_approved=True,
            approved_at=datetime.utcnow()
        )
        
        db.add(superadmin)
        await db.commit()
        await db.refresh(superadmin)
        
        print("=" * 50)
        print("超管账号创建成功！")
        print("=" * 50)
        print(f"用户名: {SUPERADMIN_EMAIL}")
        print(f"密码: {SUPERADMIN_PASSWORD}")
        print(f"用户ID: {superadmin.id}")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(init_superadmin())
