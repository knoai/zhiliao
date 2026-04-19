#!/usr/bin/env python3
"""
数据库迁移脚本：添加管理员和审核相关字段到 users 表
"""

import asyncio
import sys
import os

# 添加backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from app.database import engine


async def migrate():
    """执行迁移"""
    async with engine.begin() as conn:
        # 检查列是否已存在
        check_sql_pg = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin';
        """
        result = await conn.execute(text(check_sql_pg))
        if result.scalar_one_or_none():
            print("列已存在，跳过迁移")
            return
        
        # 添加新列
        alter_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID;",
        ]
        
        for sql in alter_statements:
            try:
                await conn.execute(text(sql))
                print(f"执行: {sql}")
            except Exception as e:
                print(f"执行失败（可能已存在）: {sql}, 错误: {e}")
        
        # 为现有用户设置默认值（第一个用户设为超管且已审核）
        # 获取第一个用户
        result = await conn.execute(
            text("SELECT id FROM users ORDER BY created_at ASC LIMIT 1;")
        )
        first_user = result.scalar_one_or_none()
        
        if first_user:
            await conn.execute(
                text("""
                UPDATE users 
                SET is_admin = TRUE, 
                    is_superadmin = TRUE, 
                    is_approved = TRUE,
                    approved_at = CURRENT_TIMESTAMP
                WHERE id = :user_id;
                """),
                {"user_id": str(first_user)}
            )
            print(f"已设置第一个用户 {first_user} 为超管")
        
        print("迁移完成！")


if __name__ == "__main__":
    asyncio.run(migrate())
