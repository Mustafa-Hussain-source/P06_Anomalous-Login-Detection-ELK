from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import declarative_base

AuthBase = declarative_base()


class AuthUser(AuthBase):
    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False, default="")
    created_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))
