from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_locked = Column(Boolean, nullable=False, default=False)
    mfa_required = Column(Boolean, nullable=False, default=False)


class LoginEvent(Base):
    __tablename__ = "login_events"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, nullable=False)
    ip_address = Column(String, nullable=False)
    user_agent = Column(String, nullable=False)
    country = Column(String, nullable=False)
    is_suspicious = Column(Boolean, nullable=False, default=False)
    risk_score = Column(Integer, nullable=False, default=0)
    event_action = Column(String, nullable=False, default="login")
    device_fingerprint = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    impossible_travel = Column(Boolean, nullable=False, default=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class MitigationLog(Base):
    __tablename__ = "mitigation_log"

    id = Column(Integer, primary_key=True, index=True)
    uc_id = Column(String, nullable=False)
    target_identifier = Column(String, nullable=False)
    action = Column(String, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class IpBlacklist(Base):
    __tablename__ = "ip_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, nullable=False)
    reason = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class ActiveSession(Base):
    __tablename__ = "active_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    device_fingerprint = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))
