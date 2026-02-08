from __future__ import annotations

import math
import random
import threading
import time
from datetime import datetime, timezone

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import SessionLocal, engine, get_db
from .models import ActiveSession, Base, LoginEvent, MitigationLog, User
from .seed import build_seed_payloads
from .simulator import simulate_uc_012, simulate_uc_013, simulate_uc_014, simulate_uc_015

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


class LoginResponse(BaseModel):
    success: bool
    message: str


RUSSIAN_THREAT_ACTOR = "Russian Threat Actor"
MALICIOUS_ENTITY = "Malicious Entity"


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

    if user.is_locked:
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
    country = x_country or "PK"

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
        ip_address = x_forwarded_for or "127.0.0.1"

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

    if event_action == "geofence_violation":
        return LoginResponse(success=False, message="geofence blocked")
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
    if seed:
        _seed_baseline_events(db)
    db.commit()
    return {"status": "cleared", "seeded": seed}


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
    background_tasks.add_task(simulate_uc_012, "http://localhost:8000")
    return {"status": "started", "uc": "UC-012"}


@app.post("/simulate/uc-013")
def trigger_uc_013(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_013, "http://localhost:8000")
    return {"status": "started", "uc": "UC-013"}


@app.post("/simulate/uc-014")
def trigger_uc_014(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_014, "http://localhost:8000")
    return {"status": "started", "uc": "UC-014"}


@app.post("/simulate/uc-015")
def trigger_uc_015(background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_uc_015, "http://localhost:8000")
    return {"status": "started", "uc": "UC-015"}
