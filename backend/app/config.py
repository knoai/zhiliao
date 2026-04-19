from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    # 应用
    APP_NAME: str = "知了云文档"
    DEBUG: bool = False
    
    # 数据库 - 本地 SQLite（无需 Docker）
    DATABASE_URL: str = "sqlite+aiosqlite:///./cloud_notes.db"
    
    # JWT
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168  # 7天

    # 前端URL
    FRONTEND_URL: str = "http://localhost:5173"

    # 飞书开放平台配置
    FEISHU_APP_ID: str | None = None
    FEISHU_APP_SECRET: str | None = None
    FEISHU_REDIRECT_URI: str = "http://localhost:5174/feishu/callback"
    FEISHU_TOKEN_ENCRYPTION_KEY: str = "default-32-byte-encryption-key!!!"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
