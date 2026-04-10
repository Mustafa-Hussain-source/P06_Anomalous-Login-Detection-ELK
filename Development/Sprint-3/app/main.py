from __future__ import annotations

import json
import importlib.util
import math
import os
import random
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import SessionLocal, engine, get_db
from .models import ActiveSession, Base, IpBlacklist, LoginEvent, MitigationLog, User
from .seed import build_seed_payloads
from .simulator import (
    simulate_uc_012,
    simulate_uc_013,
    simulate_uc_014,
    simulate_uc_015,
    simulate_uc_016,
    simulate_uc_018,
    simulate_uc_019,
)
from typing import Annotated

BASE_URL = "http://localhost:8000"

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ALDS Sprint 3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

def _handle_uc_result(db, uc_code, target, action_name, result, actions, statuses):
    if result.status == "success":
        _record_mitigation(
            db,
            uc_code,
            target,
            action_name,
            status="success",
        )
        actions.append(result.action)
        statuses.append(result.status)

def _apply_sprint4_runtime_mitigations(
    db: Session,
    payload: LoginRequest,
    login_event: LoginEvent,
) -> tuple[str | None, str | None]:

    if SPRINT4_ENGINE is None:
        return None, None

    actions: list[str] = []
    statuses: list[str] = []

    #UC-016
    if payload.api_key_compromised:
        result = SPRINT4_ENGINE.run_uc_action(
            "UC-016",
            {
                "user_id": login_event.username,
                "api_key_id": payload.api_key_id or "",
                "compromised": payload.api_key_compromised,
            },
        )
        _handle_uc_result(
            db,
            "UC-016",
            payload.api_key_id or login_event.username,
            "api_key_revoke",
            result,
            actions,
            statuses,
        )

    #UC-018
    result = SPRINT4_ENGINE.run_uc_action(
        "UC-018",
        {
            "username": login_event.username,
            "is_admin_console": payload.is_admin_console,
            "risk_score": login_event.risk_score / 100.0,
            "threshold": 0.85,
        },
    )
    _handle_uc_result(
        db,
        "UC-018",
        login_event.username,
        "admin_console_block",
        result,
        actions,
        statuses,
    )

    # UC-019
    if login_event.is_suspicious and login_event.risk_score >= 85:
        result = SPRINT4_ENGINE.run_uc_action(
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
        _handle_uc_result(
            db,
            "UC-019",
            payload.containment_entity or login_event.username,
            "containment_ticket_create",
            result,
            actions,
            statuses,
        )

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


@app.post("/login", response_model=LoginResponse)
def _handle_blacklisted_ip(db, username, client_ip, payload, client_country, user):
    blacklisted_ip = (
        db.query(IpBlacklist)
        .filter(IpBlacklist.ip_address == client_ip)
        .one_or_none()
    )

    if not blacklisted_ip:
        return None

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

    return "BLOCKED"
def _handle_locked_user(db, user, username, client_ip, payload, client_country):
    if not user.is_locked:
        return None

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

    return "LOCKED"

def _evaluate_login_risk(db, user, username, payload, client_country):
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

        if country in {"RU", "CN", "KP"}:
            event_action = "geofence_violation"
            is_suspicious = True
            risk_score = max(risk_score, 85)
            is_success = False

        impossible_travel = _get_impossible_travel(
            db, username, payload.latitude, payload.longitude
        )
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

    if is_success and user.mfa_required:
        is_success = False
        is_suspicious = True
        risk_score = max(risk_score, 75)
        event_action = "mfa_challenge_required"

    return (
        is_success,
        event_action,
        is_suspicious,
        risk_score,
        country,
        impossible_travel,
    )

def _handle_session_and_device(db, user, payload, existing_session, is_success, event_action, is_suspicious, risk_score):
    if is_success and payload.device_fingerprint:
        if existing_session and existing_session.device_fingerprint != payload.device_fingerprint:
            event_action = "device_fingerprint_change"
            is_suspicious = True
            risk_score = max(risk_score, 90)
            db.delete(existing_session)
        elif existing_session:
            db.delete(existing_session)

        db.add(
            ActiveSession(
                user_id=user.id,
                device_fingerprint=payload.device_fingerprint,
            )
        )

    return event_action, is_suspicious, risk_score

def _build_ip(event_action, x_forwarded_for, client_ip):
    if event_action == "geofence_violation":
        return x_forwarded_for or "5.255.255.1"
    return client_ip

def _handle_mitigation_and_alert(db, user, payload, login_event):
    mitigation_action, mitigation_status = _apply_mitigation(db, user, login_event)
    sprint4_action, sprint4_status = _apply_sprint4_runtime_mitigations(db, payload, login_event)

    combined_actions = [v for v in [mitigation_action, sprint4_action] if v]
    combined_statuses = [v for v in [mitigation_status, sprint4_status] if v]

    final_action = ",".join(combined_actions) if combined_actions else None
    final_status = ",".join(combined_statuses) if combined_statuses else None

    _emit_security_alert(login_event, user.id, final_action, final_status)

    return final_action, final_status

def login(
    payload: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
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

    blacklist_result = _handle_blacklisted_ip(
        db, username, client_ip, payload, client_country, user
    )

    if blacklist_result:
        raise HTTPException(status_code=403, detail="ip blacklisted")

    lock_result = _handle_locked_user(
        db, user, username, client_ip, payload, client_country
    )

    if lock_result:
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

    (
        is_success,
        event_action,
        is_suspicious,
        risk_score,
        country,
        impossible_travel,
    ) = _evaluate_login_risk(db, user, username, payload, client_country)

    existing_session = (
        db.query(ActiveSession).filter(ActiveSession.user_id == user.id).first()
    )
    event_action, is_suspicious, risk_score = _handle_session_and_device(
        db, user, payload, existing_session, is_success, event_action, is_suspicious, risk_score
    )

    if event_action == "geofence_violation":
        country = "RU"

    ip_address = _build_ip(event_action, x_forwarded_for, client_ip)

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

    if is_suspicious:
        _handle_mitigation_and_alert(db, user, payload, login_event)

    if event_action == "geofence_violation":
        return LoginResponse(success=False, message="geofence blocked")
    if event_action == "mfa_challenge_required":
        return LoginResponse(success=False, message="mfa required")
    return LoginResponse(success=is_success, message="ok" if is_success else "invalid credentials")


@app.get("/events")
def list_events(db: Annotated[Session, Depends(get_db)], limit: int = 50):
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


@app.get("/mitigations")
def list_mitigations(db: Annotated[Session, Depends(get_db)],limit: int = 50):
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
def clear_events(db: Annotated[Session, Depends(get_db)],seed: bool = True):
    db.query(LoginEvent).delete()
    db.query(MitigationLog).delete()
    if seed:
        _seed_baseline_events(db)
    db.commit()
    return {"status": "cleared", "seeded": seed, "mitigations_cleared": True}


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


@app.post("/simulate/uc-012")
def trigger_uc_012(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_012, BASE_URL)
    return {"status": "started", "uc": "UC-012"}


@app.post("/simulate/uc-013")
def trigger_uc_013(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_013, BASE_URL)
    return {"status": "started", "uc": "UC-013"}


@app.post("/simulate/uc-014")
def trigger_uc_014(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_014, BASE_URL)
    return {"status": "started", "uc": "UC-014"}


@app.post("/simulate/uc-015")
def trigger_uc_015(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_015, BASE_URL)
    return {"status": "started", "uc": "UC-015"}


@app.post("/simulate/uc-016")
def trigger_uc_016(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_016, BASE_URL)
    return {"status": "started", "uc": "UC-016"}


@app.post("/simulate/uc-018")
def trigger_uc_018(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_018, BASE_URL)
    return {"status": "started", "uc": "UC-018"}


@app.post("/simulate/uc-019")
def trigger_uc_019(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_019, BASE_URL)
    return {"status": "started", "uc": "UC-019"}


@app.get("/sprint4/evidence")
def list_sprint4_evidence(limit: int = 50):
    if not SPRINT4_EVIDENCE_PATH.exists():
        return []

    lines = SPRINT4_EVIDENCE_PATH.read_text(encoding="utf-8").splitlines()
    records: list[dict] = []
    for line in reversed(lines):
        if not line.strip():
            continue
        try:
            records.append(dict(json.loads(line)))
        except json.JSONDecodeError:
            continue
        if len(records) >= max(limit, 1):
            break
    return records
