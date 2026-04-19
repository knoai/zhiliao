import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Uuid
from app.database import Base


class FeishuBinding(Base):
    """飞书账号绑定"""
    __tablename__ = "feishu_bindings"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )

    feishu_open_id = Column(String(100), nullable=False)
    feishu_union_id = Column(String(100), nullable=True)
    feishu_user_name = Column(String(100), nullable=True)
    feishu_avatar = Column(String(500), nullable=True)

    # Token（建议AES加密后存储）
    access_token = Column(String(500), nullable=False)
    refresh_token = Column(String(500), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
