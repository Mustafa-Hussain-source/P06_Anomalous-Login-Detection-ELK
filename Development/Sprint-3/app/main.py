from __future__ import annotations

import json
import importlib.util
import math
import os
import random
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .auth_database import AuthSessionLocal, auth_engine, get_auth_db
from .auth_models import AuthBase, AuthUser
from .database import DB_PATH, SessionLocal, engine, get_db
from .extended_api import router as extended_router
from .models import AccessRestriction, ActiveSession, Base, IpBlacklist, LoginEvent, MitigationLog, User
from .seed import build_seed_payloads
from .simulator import (
    simulate_uc_012,
    simulate_uc_013,
    simulate_uc_014,
    simulate_uc_015,
    simulate_uc_016,
    simulate_uc_017,
    simulate_uc_018,
    simulate_uc_019,
    simulate_uc_020,
)

Base.metadata.create_all(bind=engine)
AuthBase.metadata.create_all(bind=auth_engine)

app = FastAPI(title="ALDS Sprint 3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extended_router)


class LoginRequest(BaseModel):
    username: str
    password: str
    user_agent: str = "unknown"
    device_fingerprint: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_admin_console: bool = False
    api_key_id: str | None = None
    api_key_compromised: bool = False
    containment_entity: str | None = None


class LoginResponse(BaseModel):
    success: bool
    message: str


class SeedUserCreateRequest(BaseModel):
    username: str
    password: str = "password123"
    is_locked: bool = False
    mfa_required: bool = False


class SeedUserUpdateRequest(BaseModel):
    username: str | None = None
    password: str | None = None
    is_locked: bool | None = None
    mfa_required: bool | None = None


class AuthLoginRequest(BaseModel):
    username: str
    password: str


class AuthUserCreateRequest(BaseModel):
    username: str
    password: str
    display_name: str | None = None


RUSSIAN_THREAT_ACTOR = "Russian Threat Actor"
MALICIOUS_ENTITY = "Malicious Entity"
WAZUH_ALERT_PATH = Path(
    os.getenv(
        "ALDS_WAZUH_ALERTS_PATH",
        str(Path(__file__).resolve().parents[1] / "wazuh" / "alerts" / "alerts.json"),
    )
)

SPRINT4_UC_AUTOMATION_PATH = Path(__file__).resolve().parents[2] / "Sprint-4" / "uc_automation.py"
SPRINT4_EVIDENCE_PATH = (
    Path(__file__).resolve().parents[2] / "Sprint-4" / "artifacts" / "runtime_mitigation_evidence.jsonl"
)
BLOCKED_COUNTRIES_UC017 = {"IR", "SY", "KP"}
PASSWORD_SPRAY_WINDOW_MINUTES = 15
PASSWORD_SPRAY_DISTINCT_USERS_THRESHOLD = 5
PASSWORD_SPRAY_TEMP_RESTRICTION_MINUTES = 30
DEFAULT_AUTH_USERNAME = "26100015"
# DEFAULT_AUTH_PASSWORD = "admintest"
DEFAULT_AUTH_PASSWORD = os.getenv("DEFAULT_AUTH_PASSWORD", "admintest")
DEFAULT_AUTH_DISPLAY_NAME = "n1a7i"


def _load_sprint4_engine():
    if not SPRINT4_UC_AUTOMATION_PATH.exists():
        return None

    try:
        module_name = "sprint4_uc_automation"
        spec = importlib.util.spec_from_file_location(module_name, SPRINT4_UC_AUTOMATION_PATH)
        if not spec or not spec.loader:
            return None
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        engine_cls = getattr(module, "Sprint4AutomationEngine", None)
        if engine_cls is None:
            return None
        return engine_cls(evidence_file=str(SPRINT4_EVIDENCE_PATH))
    except Exception:
        return None


SPRINT4_ENGINE = _load_sprint4_engine()


def _append_wazuh_alert(alert: dict) -> None:
    WAZUH_ALERT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with WAZUH_ALERT_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(alert, ensure_ascii=False) + "\n")


def _record_mitigation(
    db: Session,
    uc_id: str,
    target_identifier: str,
    action: str,
    status: str = "blocked",
) -> None:
    if uc_id == "UC-012" and action == "account_lock":
        existing = (
            db.query(MitigationLog)
            .filter(
                MitigationLog.uc_id == uc_id,
                MitigationLog.target_identifier == target_identifier,
                MitigationLog.action == action,
                MitigationLog.status == "blocked",
            )
            .order_by(MitigationLog.id.desc())
            .first()
        )
        if existing:
            return

    db.add(
        MitigationLog(
            uc_id=uc_id,
            target_identifier=target_identifier,
            action=action,
            status=status,
            timestamp=datetime.now().astimezone(),
        )
    )


def _apply_sprint4_runtime_mitigations(
    db: Session,
    payload: LoginRequest,
    login_event: LoginEvent,
) -> tuple[str | None, str | None]:
    if SPRINT4_ENGINE is None:
        return None, None

    actions: list[str] = []
    statuses: list[str] = []

    if payload.api_key_compromised:
        uc_016_result = SPRINT4_ENGINE.run_uc_action(
            "UC-016",
            {
                "user_id": login_event.username,
                "api_key_id": payload.api_key_id or "",
                "compromised": payload.api_key_compromised,
            },
        )
        if uc_016_result.status == "success":
            _record_mitigation(
                db,
                "UC-016",
                payload.api_key_id or login_event.username,
                "api_key_revoke",
                status="success",
            )
            actions.append(uc_016_result.action)
            statuses.append(uc_016_result.status)

    uc_018_result = SPRINT4_ENGINE.run_uc_action(
        "UC-018",
        {
            "username": login_event.username,
            "is_admin_console": payload.is_admin_console,
            "risk_score": login_event.risk_score / 100.0,
            "threshold": 0.85,
        },
    )
    if uc_018_result.status == "success":
        _record_mitigation(
            db,
            "UC-018",
            login_event.username,
            "admin_console_block",
            status="success",
        )
        actions.append(uc_018_result.action)
        statuses.append(uc_018_result.status)

    if login_event.is_suspicious and login_event.risk_score >= 85:
        uc_019_result = SPRINT4_ENGINE.run_uc_action(
            "UC-019",
            {
                "entity": payload.containment_entity or login_event.username,
                "severity": "high" if login_event.risk_score >= 90 else "medium",
                "context": {
                    "source": "sprint3_runtime",
                    "event_action": login_event.event_action,
                    "risk_score": login_event.risk_score,
                    "ip_address": login_event.ip_address,
                },
            },
        )
        if uc_019_result.status == "success":
            _record_mitigation(
                db,
                "UC-019",
                payload.containment_entity or login_event.username,
                "containment_ticket_create",
                status="success",
            )
            actions.append(uc_019_result.action)
            statuses.append(uc_019_result.status)

    if actions:
        db.commit()
        return ",".join(actions), ",".join(statuses)
    return None, None


def _emit_security_alert(
    login_event: LoginEvent,
    user_id: int,
    mitigation_action: str | None,
    mitigation_status: str | None,
) -> None:
    rule_map = {
        "login_failure": (100012, "UC-012 Brute Force Attempt"),
        "blocked_malicious_actor": (100012, "UC-012 Malicious Actor Blocked"),
        "account_locked_block": (100012, "UC-012 Account Locked"),
        "geofence_violation": (100013, "UC-013 Geofence Violation"),
        "ip_blacklist_block": (100013, "UC-013 Blacklisted IP Blocked"),
        "device_fingerprint_change": (100014, "UC-014 Session Hijack Attempt"),
        "impossible_travel": (100015, "UC-015 Impossible Travel"),
        "mfa_challenge_required": (100015, "UC-015 MFA Challenge Required"),
        "blocked_country_login_attempt": (100017, "UC-017 Blocked Country Login Attempt"),
        "temporary_access_restriction": (100210, "UC-020 Password Spray Use Case"),
    }
    rule_id, description = rule_map.get(
        login_event.event_action,
        (100000, "ALDS Suspicious Login Event"),
    )

    alert = {
        "rule": {
            "id": rule_id,
            "description": description,
        },
        "username": login_event.username,
        "srcip": login_event.ip_address,
        "event_action": login_event.event_action,
        "risk_score": login_event.risk_score,
        "country": login_event.country,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "user_id": user_id,
            "event_id": login_event.id,
            "mitigation_action": mitigation_action,
            "mitigation_status": mitigation_status,
        },
    }
    _append_wazuh_alert(alert)


def _is_password_spray(db: Session, client_ip: str, username: str) -> bool:
    cutoff = datetime.now().astimezone() - timedelta(minutes=PASSWORD_SPRAY_WINDOW_MINUTES)
    recent_events = (
        db.query(LoginEvent)
        .filter(
            LoginEvent.ip_address == client_ip,
            LoginEvent.timestamp >= cutoff,
            LoginEvent.event_action.in_(["login_failure", "blocked_malicious_actor", "temporary_access_restriction"]),
        )
        .all()
    )
    distinct_users = {event.username for event in recent_events}
    distinct_users.add(username)
    return len(distinct_users) >= PASSWORD_SPRAY_DISTINCT_USERS_THRESHOLD


def _apply_mitigation(db: Session, user: User, login_event: LoginEvent) -> tuple[str | None, str | None]:
    mitigation_action = None
    mitigation_status = None

    if login_event.event_action == "geofence_violation":
        existing_ip = (
            db.query(IpBlacklist)
            .filter(IpBlacklist.ip_address == login_event.ip_address)
            .one_or_none()
        )
        if not existing_ip:
            db.add(
                IpBlacklist(
                    ip_address=login_event.ip_address,
                    reason="UC-013 geofencing",
                    timestamp=datetime.now().astimezone(),
                )
            )
        _record_mitigation(db, "UC-013", login_event.ip_address, "ip_block")
        mitigation_action = "ip_block"
        mitigation_status = "blocked"

    elif login_event.event_action == "blocked_country_login_attempt":
        _record_mitigation(db, "UC-017", login_event.username, "region_block")
        mitigation_action = "region_block"
        mitigation_status = "blocked"

    elif login_event.event_action == "temporary_access_restriction":
        existing_restriction = (
            db.query(AccessRestriction)
            .filter(
                AccessRestriction.target_type == "ip",
                AccessRestriction.target_value == login_event.ip_address,
                AccessRestriction.active.is_(True),
            )
            .order_by(AccessRestriction.id.desc())
            .first()
        )
        if existing_restriction:
            existing_restriction.expires_at = datetime.now().astimezone() + timedelta(
                minutes=PASSWORD_SPRAY_TEMP_RESTRICTION_MINUTES
            )
        else:
            db.add(
                AccessRestriction(
                    target_type="ip",
                    target_value=login_event.ip_address,
                    reason="UC-020 password spray temporary restriction",
                    active=True,
                    expires_at=datetime.now().astimezone()
                    + timedelta(minutes=PASSWORD_SPRAY_TEMP_RESTRICTION_MINUTES),
                )
            )
        _record_mitigation(db, "UC-020", login_event.ip_address, "temporary_access_restriction")
        mitigation_action = "temporary_access_restriction"
        mitigation_status = "restricted"

    elif login_event.event_action == "device_fingerprint_change":
        db.query(ActiveSession).filter(ActiveSession.user_id == user.id).delete()
        _record_mitigation(db, "UC-014", login_event.username, "session_kill")
        mitigation_action = "session_kill"
        mitigation_status = "blocked"

    elif login_event.event_action == "impossible_travel":
        user.mfa_required = True
        _record_mitigation(db, "UC-015", login_event.username, "mfa_stepup")
        mitigation_action = "mfa_stepup"
        mitigation_status = "blocked"

    elif login_event.event_action in {"login_failure", "blocked_malicious_actor"}:
        recent_failures = (
            db.query(LoginEvent)
            .filter(
                LoginEvent.username == login_event.username,
                LoginEvent.event_action.in_(["login_failure", "blocked_malicious_actor"]),
            )
            .order_by(LoginEvent.id.desc())
            .limit(5)
            .all()
        )
        if len(recent_failures) >= 5:
            user.is_locked = True
            _record_mitigation(db, "UC-012", login_event.username, "account_lock")
            mitigation_action = "account_lock"
            mitigation_status = "blocked"

    if mitigation_action:
        db.commit()
    return mitigation_action, mitigation_status


def _hash_password(password: str) -> str:
    return f"hash:{password}"


def _ensure_default_auth_user() -> None:
    with auth_engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(auth_users)")).fetchall()
        column_names = {str(column[1]) for column in columns}
        if "display_name" not in column_names:
            connection.execute(text("ALTER TABLE auth_users ADD COLUMN display_name VARCHAR DEFAULT ''"))

    db = AuthSessionLocal()
    try:
        row = db.query(AuthUser).filter(AuthUser.username == DEFAULT_AUTH_USERNAME).one_or_none()
        if row is None:
            row = AuthUser(
                username=DEFAULT_AUTH_USERNAME,
                password_hash=_hash_password(DEFAULT_AUTH_PASSWORD),
                display_name=DEFAULT_AUTH_DISPLAY_NAME,
            )
            db.add(row)
        else:
            row.password_hash = _hash_password(DEFAULT_AUTH_PASSWORD)
            row.display_name = DEFAULT_AUTH_DISPLAY_NAME
        db.commit()
    finally:
        db.close()


_ensure_default_auth_user()


@app.post("/auth/login")
def auth_login(payload: AuthLoginRequest, db: Session = Depends(get_auth_db)):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="username required")

    row = db.query(AuthUser).filter(AuthUser.username == username).one_or_none()
    if row is None or row.password_hash != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="invalid username or password")

    return {
        "success": True,
        "username": row.username,
        "display_name": row.display_name or row.username,
        "message": "Login successful",
    }


@app.post("/auth/users")
def create_auth_user(payload: AuthUserCreateRequest, db: Session = Depends(get_auth_db)):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="username required")
    if not payload.password:
        raise HTTPException(status_code=400, detail="password required")

    if db.query(AuthUser).filter(AuthUser.username == username).one_or_none() is not None:
        raise HTTPException(status_code=409, detail="username already exists")

    display_name = (payload.display_name or "").strip() or username
    row = AuthUser(username=username, password_hash=_hash_password(payload.password), display_name=display_name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "username": row.username, "display_name": row.display_name}


@app.get("/auth/users")
def list_auth_users(db: Session = Depends(get_auth_db)):
    rows = db.query(AuthUser).order_by(AuthUser.id.asc()).all()
    return [{"id": row.id, "username": row.username, "display_name": row.display_name or row.username} for row in rows]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def _to_local_iso(value):
    if value is None:
        return None
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    if isinstance(value, datetime):
        local_now = datetime.now().astimezone()
        if value.tzinfo is None:
            value = value.replace(tzinfo=local_now.tzinfo)
        return value.astimezone().isoformat()
    return value


def _seed_baseline_events(db: Session) -> None:
    users_payload, events_payload = build_seed_payloads()
    baseline_usernames = {username for username, _ in users_payload if username != "unknown"}
    for username, password_hash in users_payload:
        existing = db.query(User).filter(User.username == username).one_or_none()
        if not existing:
            db.add(
                User(
                    username=username,
                    password_hash=password_hash,
                    is_locked=False,
                    mfa_required=False,
                )
            )
    for (
        username,
        ip_address,
        user_agent,
        country,
        is_suspicious,
        risk_score,
        event_action,
        timestamp,
    ) in events_payload:
        if username not in baseline_usernames and not is_suspicious:
            continue
        db.add(
            LoginEvent(
                username=username,
                ip_address=ip_address,
                user_agent=user_agent,
                country=country,
                is_suspicious=bool(is_suspicious),
                risk_score=int(risk_score),
                event_action=event_action,
                timestamp=timestamp,
            )
        )


_traffic_lock = threading.Lock()
_traffic_running = False
_traffic_thread: threading.Thread | None = None


def _traffic_loop() -> None:
    global _traffic_running
    while True:
        with _traffic_lock:
            if not _traffic_running:
                break
        session = SessionLocal()
        try:
            users_payload, events_payload = build_seed_payloads()
            if not users_payload or not events_payload:
                time.sleep(2)
                continue
            baseline_usernames = {username for username, _ in users_payload if username != "unknown"}
            baseline_events = [
                event
                for event in events_payload
                if not event[4] and event[0] in baseline_usernames
            ]
            if not baseline_events:
                time.sleep(2)
                continue
            (
                username,
                ip_address,
                user_agent,
                country,
                _is_suspicious,
                _risk_score,
                _event_action,
                _timestamp,
            ) = random.choice(baseline_events)
            password_hash = "hash:password123"
            user = session.query(User).filter(User.username == username).one_or_none()
            if not user:
                session.add(
                    User(
                        username=username,
                        password_hash=password_hash,
                        is_locked=False,
                        mfa_required=False,
                    )
                )
                session.commit()
            event = LoginEvent(
                username=username,
                ip_address=ip_address,
                user_agent=user_agent,
                country=country,
                is_suspicious=False,
                risk_score=5,
                event_action="login_success",
                timestamp=datetime.now().astimezone(),
            )
            session.add(event)
            session.commit()
        finally:
            session.close()
        time.sleep(2)


def _get_impossible_travel(
    db: Session,
    username: str,
    latitude: float | None,
    longitude: float | None,
) -> bool:
    if latitude is None or longitude is None:
        return False

    last_event = (
        db.query(LoginEvent)
        .filter(
            LoginEvent.username == username,
            LoginEvent.latitude.isnot(None),
            LoginEvent.longitude.isnot(None),
        )
        .order_by(LoginEvent.id.desc())
        .first()
    )
    if not last_event or last_event.timestamp is None:
        return False

    last_time = last_event.timestamp
    local_now = datetime.now().astimezone()
    if last_time.tzinfo is None:
        last_time = last_time.replace(tzinfo=local_now.tzinfo)

    now_time = local_now
    hours = (now_time - last_time).total_seconds() / 3600.0
    if hours <= 0:
        return False

    distance_km = _haversine_km(latitude, longitude, last_event.latitude, last_event.longitude)
    speed_kmh = distance_km / hours
    return speed_kmh > 800


def _simulation_base_url(request: Request) -> str:
    scheme = request.url.scheme or "http"
    host = request.url.hostname or "127.0.0.1"
    port = request.url.port
    if port:
        return f"{scheme}://{host}:{port}"
    return f"{scheme}://{host}"


@app.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
    x_forwarded_for: str | None = Header(default=None, alias="X-Forwarded-For"),
    x_country: str | None = Header(default=None, alias="X-Country"),
    x_seed_session: str | None = Header(default=None, alias="X-Seed-Session"),
):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="username required")

    user = db.query(User).filter(User.username == username).one_or_none()
    if not user:
        user = User(
            username=username,
            password_hash=_hash_password("password123"),
            is_locked=False,
            mfa_required=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    client_ip = x_forwarded_for or "127.0.0.1"
    client_country = x_country or "PK"

    blacklisted_ip = (
        db.query(IpBlacklist)
        .filter(IpBlacklist.ip_address == client_ip)
        .one_or_none()
    )
    if blacklisted_ip:
        blacklisted_event = LoginEvent(
            username=username,
            ip_address=client_ip,
            user_agent=payload.user_agent,
            country=client_country,
            is_suspicious=True,
            risk_score=95,
            event_action="ip_blacklist_block",
            device_fingerprint=payload.device_fingerprint,
            latitude=payload.latitude,
            longitude=payload.longitude,
            impossible_travel=False,
            timestamp=datetime.now().astimezone(),
        )
        db.add(blacklisted_event)
        db.commit()
        db.refresh(blacklisted_event)

        _record_mitigation(db, "UC-013", client_ip, "ip_block")
        db.commit()

        _emit_security_alert(
            blacklisted_event,
            user.id,
            mitigation_action="ip_block",
            mitigation_status="blocked",
        )
        raise HTTPException(status_code=403, detail="ip blacklisted")

    now_local = datetime.now().astimezone()
    active_restriction = (
        db.query(AccessRestriction)
        .filter(
            AccessRestriction.target_type == "ip",
            AccessRestriction.target_value == client_ip,
            AccessRestriction.active.is_(True),
            AccessRestriction.expires_at >= now_local,
        )
        .order_by(AccessRestriction.id.desc())
        .first()
    )
    if active_restriction:
        restriction_event = LoginEvent(
            username=username,
            ip_address=client_ip,
            user_agent=payload.user_agent,
            country=client_country,
            is_suspicious=True,
            risk_score=96,
            event_action="temporary_access_restriction",
            device_fingerprint=payload.device_fingerprint,
            latitude=payload.latitude,
            longitude=payload.longitude,
            impossible_travel=False,
            timestamp=now_local,
        )
        db.add(restriction_event)
        db.commit()
        db.refresh(restriction_event)

        _record_mitigation(db, "UC-020", client_ip, "temporary_access_restriction", status="restricted")
        db.commit()

        _emit_security_alert(
            restriction_event,
            user.id,
            mitigation_action="temporary_access_restriction",
            mitigation_status="restricted",
        )
        return LoginResponse(success=False, message="temporary restriction applied")

    if user.is_locked:
        locked_event = LoginEvent(
            username=username,
            ip_address=client_ip,
            user_agent=payload.user_agent,
            country=client_country,
            is_suspicious=True,
            risk_score=95,
            event_action="account_locked_block",
            device_fingerprint=payload.device_fingerprint,
            latitude=payload.latitude,
            longitude=payload.longitude,
            impossible_travel=False,
            timestamp=datetime.now().astimezone(),
        )
        db.add(locked_event)
        db.commit()
        db.refresh(locked_event)

        _record_mitigation(db, "UC-012", username, "account_lock")
        db.commit()

        _emit_security_alert(
            locked_event,
            user.id,
            mitigation_action="account_lock",
            mitigation_status="blocked",
        )
        raise HTTPException(status_code=403, detail="account locked")

    if x_seed_session == "true" and payload.device_fingerprint:
        existing_session = (
            db.query(ActiveSession).filter(ActiveSession.user_id == user.id).first()
        )
        if existing_session:
            db.delete(existing_session)
        db.add(
            ActiveSession(user_id=user.id, device_fingerprint=payload.device_fingerprint)
        )
        db.commit()
        return LoginResponse(success=True, message="session seeded")

    is_success = payload.password == "password123"
    event_action = "login_success" if is_success else "login_failure"
    is_suspicious = not is_success
    risk_score = 80 if is_suspicious else 5
    country = client_country

    if is_success:
        if username == RUSSIAN_THREAT_ACTOR:
            country = "RU"
            event_action = "geofence_violation"
            is_suspicious = True
            risk_score = max(risk_score, 85)
            is_success = False

        if country in BLOCKED_COUNTRIES_UC017:
            event_action = "blocked_country_login_attempt"
            is_suspicious = True
            risk_score = max(risk_score, 90)
            is_success = False

        impossible_travel = _get_impossible_travel(db, username, payload.latitude, payload.longitude)
        if impossible_travel:
            event_action = "impossible_travel"
            is_suspicious = True
            risk_score = max(risk_score, 95)
    else:
        impossible_travel = False

    if username == MALICIOUS_ENTITY:
        is_success = False
        is_suspicious = True
        risk_score = max(risk_score, 90)
        if event_action == "login_success":
            event_action = "blocked_malicious_actor"

    if not is_success and _is_password_spray(db, client_ip, username):
        event_action = "temporary_access_restriction"
        is_suspicious = True
        risk_score = max(risk_score, 96)

    if is_success and user.mfa_required:
        is_success = False
        is_suspicious = True
        risk_score = max(risk_score, 75)
        event_action = "mfa_challenge_required"

    existing_session = (
        db.query(ActiveSession).filter(ActiveSession.user_id == user.id).first()
    )
    if is_success and payload.device_fingerprint:
        if existing_session and existing_session.device_fingerprint != payload.device_fingerprint:
            event_action = "device_fingerprint_change"
            is_suspicious = True
            risk_score = max(risk_score, 90)
            db.delete(existing_session)
        elif existing_session:
            db.delete(existing_session)

        db.add(
            ActiveSession(user_id=user.id, device_fingerprint=payload.device_fingerprint)
        )

    if event_action == "geofence_violation":
        country = "RU"
        ip_address = x_forwarded_for or "5.255.255.1"
    else:
        ip_address = client_ip

    login_event = LoginEvent(
        username=username,
        ip_address=ip_address,
        user_agent=payload.user_agent,
        country=country,
        is_suspicious=is_suspicious,
        risk_score=risk_score,
        event_action=event_action,
        device_fingerprint=payload.device_fingerprint,
        latitude=payload.latitude,
        longitude=payload.longitude,
        impossible_travel=impossible_travel,
        timestamp=datetime.now().astimezone(),
    )
    db.add(login_event)
    db.commit()
    db.refresh(login_event)

    mitigation_action = None
    mitigation_status = None
    if is_suspicious:
        mitigation_action, mitigation_status = _apply_mitigation(db, user, login_event)
        sprint4_action, sprint4_status = _apply_sprint4_runtime_mitigations(db, payload, login_event)

        combined_actions = [value for value in [mitigation_action, sprint4_action] if value]
        combined_statuses = [value for value in [mitigation_status, sprint4_status] if value]
        mitigation_action = ",".join(combined_actions) if combined_actions else None
        mitigation_status = ",".join(combined_statuses) if combined_statuses else None

        _emit_security_alert(login_event, user.id, mitigation_action, mitigation_status)

    if event_action == "geofence_violation":
        return LoginResponse(success=False, message="geofence blocked")
    if event_action == "blocked_country_login_attempt":
        return LoginResponse(success=False, message="blocked country")
    if event_action == "mfa_challenge_required":
        return LoginResponse(success=False, message="mfa required")
    if event_action == "temporary_access_restriction":
        return LoginResponse(success=False, message="temporary restriction applied")
    return LoginResponse(success=is_success, message="ok" if is_success else "invalid credentials")


@app.get("/events")
def list_events(limit: int = 50, db: Session = Depends(get_db)):
    events = (
        db.query(LoginEvent)
        .order_by(LoginEvent.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "username": e.username,
            "ip_address": e.ip_address,
            "user_agent": e.user_agent,
            "country": e.country,
            "is_suspicious": e.is_suspicious,
            "risk_score": e.risk_score,
            "event_action": e.event_action,
            "device_fingerprint": e.device_fingerprint,
            "latitude": e.latitude,
            "longitude": e.longitude,
            "impossible_travel": e.impossible_travel,
            "timestamp": _to_local_iso(e.timestamp),
        }
        for e in events
    ]


@app.get("/seed/database-preview")
def seed_database_preview(users_limit: int = 80, events_limit: int = 120, db: Session = Depends(get_db)):
    users_payload, events_payload = build_seed_payloads()

    seed_users = [
        {
            "username": username,
            "password_hash": password_hash,
        }
        for username, password_hash in users_payload[:users_limit]
    ]

    seed_events = [
        {
            "username": username,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "country": country,
            "is_suspicious": bool(is_suspicious),
            "risk_score": int(risk_score),
            "event_action": event_action,
            "timestamp": _to_local_iso(timestamp),
        }
        for (
            username,
            ip_address,
            user_agent,
            country,
            is_suspicious,
            risk_score,
            event_action,
            timestamp,
        ) in events_payload[:events_limit]
    ]

    live_users = (
        db.query(User)
        .order_by(User.id.asc())
        .limit(users_limit)
        .all()
    )
    live_events = (
        db.query(LoginEvent)
        .order_by(LoginEvent.id.desc())
        .limit(events_limit)
        .all()
    )

    return {
        "database_path": str(DB_PATH),
        "seed_template": {
            "total_users": len(users_payload),
            "total_events": len(events_payload),
            "suspicious_events": sum(1 for item in events_payload if bool(item[4])),
            "users": seed_users,
            "events": seed_events,
        },
        "live_database": {
            "total_users": db.query(User).count(),
            "total_events": db.query(LoginEvent).count(),
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "is_locked": bool(user.is_locked),
                    "mfa_required": bool(user.mfa_required),
                }
                for user in live_users
            ],
            "events": [
                {
                    "id": event.id,
                    "username": event.username,
                    "ip_address": event.ip_address,
                    "country": event.country,
                    "risk_score": event.risk_score,
                    "event_action": event.event_action,
                    "is_suspicious": bool(event.is_suspicious),
                    "timestamp": _to_local_iso(event.timestamp),
                }
                for event in live_events
            ],
        },
    }


@app.get("/seed/users")
def list_seed_users(limit: int = 200, db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).limit(limit).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "is_locked": bool(user.is_locked),
            "mfa_required": bool(user.mfa_required),
        }
        for user in users
    ]


@app.post("/seed/users")
def create_seed_user(body: SeedUserCreateRequest, db: Session = Depends(get_db)):
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="username required")

    if db.query(User).filter(User.username == username).one_or_none() is not None:
        raise HTTPException(status_code=409, detail="username already exists")

    row = User(
        username=username,
        password_hash=_hash_password(body.password),
        is_locked=body.is_locked,
        mfa_required=body.mfa_required,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {
        "id": row.id,
        "username": row.username,
        "is_locked": bool(row.is_locked),
        "mfa_required": bool(row.mfa_required),
    }


@app.patch("/seed/users/{user_id}")
def update_seed_user(user_id: int, body: SeedUserUpdateRequest, db: Session = Depends(get_db)):
    row = db.query(User).filter(User.id == user_id).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="user not found")

    if body.username is not None:
        username = body.username.strip()
        if not username:
            raise HTTPException(status_code=400, detail="username cannot be empty")
        row.username = username

    if body.password is not None:
        row.password_hash = _hash_password(body.password)

    if body.is_locked is not None:
        row.is_locked = body.is_locked

    if body.mfa_required is not None:
        row.mfa_required = body.mfa_required

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="username already exists") from exc

    db.refresh(row)
    return {
        "id": row.id,
        "username": row.username,
        "is_locked": bool(row.is_locked),
        "mfa_required": bool(row.mfa_required),
    }


@app.delete("/seed/users/{user_id}")
def delete_seed_user(user_id: int, db: Session = Depends(get_db)):
    row = db.query(User).filter(User.id == user_id).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="user not found")

    db.query(ActiveSession).filter(ActiveSession.user_id == row.id).delete()
    db.delete(row)
    db.commit()
    return {"id": user_id, "status": "deleted"}


@app.get("/mitigations")
def list_mitigations(limit: int = 50, db: Session = Depends(get_db)):
    items = (
        db.query(MitigationLog)
        .order_by(MitigationLog.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": m.id,
            "uc_id": m.uc_id,
            "target_identifier": m.target_identifier,
            "action": m.action,
            "status": m.status,
            "timestamp": _to_local_iso(m.timestamp),
        }
        for m in items
    ]


@app.post("/events/clear")
def clear_events(seed: bool = True, db: Session = Depends(get_db)):
    db.query(LoginEvent).delete()
    db.query(MitigationLog).delete()
    db.query(AccessRestriction).delete()
    if seed:
        _seed_baseline_events(db)
    db.commit()
    return {
        "status": "cleared",
        "seeded": seed,
        "mitigations_cleared": True,
        "restrictions_cleared": True,
    }


@app.post("/traffic/start")
def start_traffic():
    global _traffic_running, _traffic_thread
    with _traffic_lock:
        if _traffic_running:
            return {"status": "running"}
        _traffic_running = True
        _traffic_thread = threading.Thread(target=_traffic_loop, daemon=True)
        _traffic_thread.start()
    return {"status": "started"}


@app.post("/traffic/stop")
def stop_traffic():
    global _traffic_running
    with _traffic_lock:
        _traffic_running = False
    return {"status": "stopped"}


@app.get("/traffic/status")
def traffic_status():
    with _traffic_lock:
        running = _traffic_running
    return {"status": "running" if running else "stopped", "running": running}


@app.post("/simulate/uc-012")
def trigger_uc_012(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_012, _simulation_base_url(request))
    return {"status": "started", "uc": "UC-012"}


@app.post("/simulate/uc-013")
def trigger_uc_013(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_013, _simulation_base_url(request))
    return {"status": "started", "uc": "UC-013"}


@app.post("/simulate/uc-014")
def trigger_uc_014(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_014, _simulation_base_url(request))
    return {"status": "started", "uc": "UC-014"}


@app.post("/simulate/uc-015")
def trigger_uc_015(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(simulate_uc_015, _simulation_base_url(request))
    _record_mitigation(db, "UC-015", "Impossible Travel Tester", "mfa_stepup", status="pending")
    db.commit()
    return {"status": "started", "uc": "UC-015"}


@app.post("/simulate/uc-016")
def trigger_uc_016(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(simulate_uc_016, _simulation_base_url(request))
    _record_mitigation(db, "UC-016", "sim-key-016", "api_key_revoke", status="pending")
    db.commit()
    return {"status": "started", "uc": "UC-016"}


@app.post("/simulate/uc-017")
def trigger_uc_017(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(simulate_uc_017, _simulation_base_url(request))
    _record_mitigation(db, "UC-017", "Blocked Region Tester", "region_block", status="pending")
    db.commit()
    return {"status": "started", "uc": "UC-017"}


@app.post("/simulate/uc-018")
def trigger_uc_018(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(simulate_uc_018, _simulation_base_url(request))
    _record_mitigation(db, "UC-018", "Sprint4 Admin User", "admin_console_block", status="pending")
    db.commit()
    return {"status": "started", "uc": "UC-018"}


@app.post("/simulate/uc-019")
def trigger_uc_019(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_019, _simulation_base_url(request))
    return {"status": "started", "uc": "UC-019"}


@app.post("/simulate/uc-020")
def trigger_uc_020(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(simulate_uc_020, _simulation_base_url(request))
    _record_mitigation(db, "UC-020", "203.0.113.20", "temporary_access_restriction", status="pending")
    db.commit()
    return {"status": "started", "uc": "UC-020"}


@app.get("/sprint4/evidence")
def list_sprint4_evidence(limit: int = 50, db: Session = Depends(get_db)):
    max_items = max(limit, 1)
    records: list[dict] = []

    if SPRINT4_EVIDENCE_PATH.exists():
        lines = SPRINT4_EVIDENCE_PATH.read_text(encoding="utf-8").splitlines()
        for line in reversed(lines):
            if not line.strip():
                continue
            try:
                records.append(dict(json.loads(line)))
            except json.JSONDecodeError:
                continue
            if len(records) >= max_items:
                break

    if records:
        return records

    # VM light mode fallback: synthesize runtime evidence from mitigation logs.
    mitigations = (
        db.query(MitigationLog)
        .order_by(MitigationLog.id.desc())
        .limit(max_items)
        .all()
    )

    synthetic_records: list[dict] = []
    for item in mitigations:
        synthetic_records.append(
            {
                "uc_id": item.uc_id,
                "event": f"{item.action}_event",
                "action": item.action,
                "status": str(item.status or "pending").upper(),
                "timestamp": _to_local_iso(item.timestamp),
                "details": {
                    "target_identifier": item.target_identifier,
                    "source": "sprint3_light_mode_fallback",
                    "mitigation_id": item.id,
                },
            }
        )

    return synthetic_records
