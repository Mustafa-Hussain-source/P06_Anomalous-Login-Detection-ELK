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


class AccessRestriction(Base):
    __tablename__ = "access_restrictions"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String, nullable=False)
    target_value = Column(String, nullable=False, index=True)
    reason = Column(String, nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class EventTriage(Base):
    __tablename__ = "event_triage"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, nullable=False, unique=True, index=True)
    status = Column(String, nullable=False, default="new")
    analyst = Column(String, nullable=False, default="unassigned")
    severity = Column(String, nullable=False, default="medium")
    notes = Column(String, nullable=False, default="")
    updated_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class IncidentCase(Base):
    __tablename__ = "incident_cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open")
    priority = Column(String, nullable=False, default="medium")
    owner = Column(String, nullable=False, default="unassigned")
    summary = Column(String, nullable=False, default="")
    created_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))
    updated_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class CaseEventLink(Base):
    __tablename__ = "case_event_link"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, nullable=False, index=True)
    event_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    threshold = Column(Float, nullable=False, default=1.0)
    enabled = Column(Boolean, nullable=False, default=True)
    confidence = Column(Float, nullable=False, default=0.8)
    false_positive_rate = Column(Float, nullable=False, default=0.05)
    updated_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, unique=True, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    updated_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))


class ContainmentTicket(Base):
    __tablename__ = "containment_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, nullable=False, unique=True, index=True)
    entity = Column(String, nullable=False)
    severity = Column(String, nullable=False, default="medium")
    status = Column(String, nullable=False, default="open")
    summary = Column(String, nullable=False, default="")
    source = Column(String, nullable=False, default="ui")
    created_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))
    updated_at = Column(DateTime, nullable=False, server_default=func.datetime("now", "localtime"))
