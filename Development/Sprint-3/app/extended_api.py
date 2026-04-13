from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models import (
    AccessRestriction,
    CaseEventLink,
    ContainmentTicket,
    DetectionRule,
    EventTriage,
    IncidentCase,
    LoginEvent,
    MitigationLog,
    SecurityPolicy,
)

router = APIRouter(tags=["extended"])


class EventTriageRequest(BaseModel):
    status: str = "in_review"
    analyst: str = "unassigned"
    severity: str = "medium"
    notes: str = ""


class CreateCaseRequest(BaseModel):
    title: str
    status: str = "open"
    priority: str = "medium"
    owner: str = "unassigned"
    summary: str = ""
    event_ids: list[int] = []


class UpdateCaseRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    owner: str | None = None
    summary: str | None = None


class DetectionRuleRequest(BaseModel):
    threshold: float | None = None
    enabled: bool | None = None
    confidence: float | None = None
    false_positive_rate: float | None = None


class PolicyRequest(BaseModel):
    value: str


class CreateTicketRequest(BaseModel):
    entity: str
    severity: str = "medium"
    summary: str = ""
    source: str = "ui"


class RestrictionRequest(BaseModel):
    target_type: str
    target_value: str
    reason: str
    expires_at: str


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        local = datetime.now().astimezone()
        if value.tzinfo is None:
            value = value.replace(tzinfo=local.tzinfo)
        return value.astimezone().isoformat()
    return str(value)


def _seed_detection_rules(db: Session) -> None:
    rules = [
        ("bruteforce", "Brute Force", "Detect rapid repeated auth failures", 50.0, 0.94, 0.06),
        ("impossible_travel", "Impossible Travel", "Geo velocity over threshold", 800.0, 0.97, 0.03),
        ("password_spray", "Password Spray", "Single source against many users", 5.0, 0.91, 0.08),
        ("blocked_country", "Blocked Country", "Geo deny-list login attempts", 1.0, 0.99, 0.01),
        ("session_hijack", "Session Hijack", "Fingerprint change while active session", 1.0, 0.92, 0.07),
    ]

    for key, name, description, threshold, confidence, fpr in rules:
        existing = db.query(DetectionRule).filter(DetectionRule.key == key).one_or_none()
        if existing:
            continue
        db.add(
            DetectionRule(
                key=key,
                name=name,
                description=description,
                threshold=threshold,
                enabled=True,
                confidence=confidence,
                false_positive_rate=fpr,
            )
        )
    db.commit()


@router.get("/analytics/kpi")
def analytics_kpi(db: Annotated[Session, Depends(get_db)]):
    events = db.query(LoginEvent).all()
    mitigations = db.query(MitigationLog).all()
    triage_rows = db.query(EventTriage).all()
    ticket_rows = db.query(ContainmentTicket).all()

    suspicious = [event for event in events if bool(event.is_suspicious)]
    blocked = [event for event in events if "block" in str(event.event_action)]
    avg_risk = round(sum(event.risk_score for event in events) / len(events), 2) if events else 0.0

    now_local = datetime.now().astimezone()
    local_tz = now_local.tzinfo
    recent_cutoff = now_local - timedelta(hours=24)

    def _to_local_aware(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=local_tz)
        return value.astimezone(local_tz)

    def _robust_average(values: list[float], fallback: float) -> float:
        if not values:
            return fallback
        ordered = sorted(values)
        if len(ordered) >= 10:
            trim = max(1, int(len(ordered) * 0.1))
            ordered = ordered[trim:-trim] or ordered
        return round(sum(ordered) / len(ordered), 2)

    # MTTD: average seconds between event creation and analyst triage update.
    events_by_id = {event.id: event for event in events}
    triage_deltas: list[float] = []
    for row in triage_rows:
        source_event = events_by_id.get(row.event_id)
        if source_event is None:
            continue
        event_ts = _to_local_aware(source_event.timestamp)
        triage_ts = _to_local_aware(row.updated_at)
        if event_ts is None or triage_ts is None:
            continue
        if triage_ts < recent_cutoff:
            continue
        delta = (triage_ts - event_ts).total_seconds()
        if delta >= 0:
            triage_deltas.append(delta)

    # MTTR: average seconds from ticket creation to ticket closure.
    # Ignore lifecycle spans above 6 hours to avoid stale historical skew.
    max_mttr_sample_seconds = 6 * 60 * 60
    resolved_statuses = {"closed", "resolved", "contained", "completed", "blocked", "restricted"}
    mttr_deltas: list[float] = []
    for row in ticket_rows:
        status = str(row.status or "").strip().lower()
        if status not in resolved_statuses:
            continue
        created_ts = _to_local_aware(row.created_at)
        updated_ts = _to_local_aware(row.updated_at)
        if created_ts is None or updated_ts is None:
            continue
        if updated_ts < recent_cutoff:
            continue
        delta = (updated_ts - created_ts).total_seconds()
        if 0 <= delta <= max_mttr_sample_seconds:
            mttr_deltas.append(delta)

    # Fallback MTTR estimator from suspicious-event to next mitigation timestamp.
    if not mttr_deltas:
        suspicious_times = []
        for event in suspicious:
            event_ts = _to_local_aware(event.timestamp)
            if event_ts and event_ts >= recent_cutoff:
                suspicious_times.append(event_ts)
        suspicious_times.sort()

        mitigation_times = []
        for mitigation in mitigations:
            mitigation_ts = _to_local_aware(mitigation.timestamp)
            if mitigation_ts and mitigation_ts >= recent_cutoff:
                mitigation_times.append(mitigation_ts)
        mitigation_times.sort()

        mitigation_pair_deltas: list[float] = []
        pointer = 0
        for event_ts in suspicious_times:
            while pointer < len(mitigation_times) and mitigation_times[pointer] < event_ts:
                pointer += 1
            if pointer < len(mitigation_times):
                delta = (mitigation_times[pointer] - event_ts).total_seconds()
                if 0 <= delta <= max_mttr_sample_seconds:
                    mitigation_pair_deltas.append(delta)

        mttr_deltas = mitigation_pair_deltas

    # FPR: percent of triaged alerts that analysts mark as benign/false positive.
    false_positive_markers = {"false_positive", "false positive", "benign", "dismissed", "safe", "no_threat"}
    triage_resolved_markers = {"new", "in_review", "open", "pending"}

    resolved_triage_count = 0
    false_positive_count = 0
    for row in triage_rows:
        status = str(row.status or "").strip().lower()
        if status in triage_resolved_markers:
            continue
        resolved_triage_count += 1
        if status in false_positive_markers:
            false_positive_count += 1

    if triage_deltas:
        dynamic_mttd = _robust_average(triage_deltas, 18.0)
    else:
        # If no analyst triage yet, estimate detection lag from open suspicious queue age.
        open_triage_event_ids = {
            row.event_id
            for row in triage_rows
            if str(row.status or "").strip().lower() in triage_resolved_markers
        }
        open_suspicious_ages = []
        for event in suspicious:
            event_ts = _to_local_aware(event.timestamp)
            if event_ts is None or event_ts < recent_cutoff:
                continue
            if event.id in open_triage_event_ids:
                open_suspicious_ages.append(min((now_local - event_ts).total_seconds(), 600.0))
        dynamic_mttd = _robust_average(open_suspicious_ages, 18.0)

    dynamic_mttr = _robust_average(mttr_deltas, 91.0)

    if resolved_triage_count:
        dynamic_fpr = round(false_positive_count / resolved_triage_count, 4)
    else:
        recent_suspicious = [
            event for event in suspicious if (_to_local_aware(event.timestamp) or now_local) >= recent_cutoff
        ]
        estimated_fp = [
            event
            for event in recent_suspicious
            if event.risk_score < 60 and "block" not in str(event.event_action).lower()
        ]
        dynamic_fpr = round(len(estimated_fp) / len(recent_suspicious), 4) if recent_suspicious else 0.06

    return {
        "total_events": len(events),
        "suspicious_events": len(suspicious),
        "blocked_events": len(blocked),
        "mitigations": len(mitigations),
        "avg_risk": avg_risk,
        "mttd_seconds": dynamic_mttd,
        "mttr_seconds": dynamic_mttr,
        "false_positive_rate": dynamic_fpr,
    }


@router.get("/analytics/threat-heatmap")
def analytics_threat_heatmap(db: Annotated[Session, Depends(get_db)]):
    rows = (
        db.query(LoginEvent.country, LoginEvent.timestamp)
        .filter(LoginEvent.impossible_travel.is_(True))
        .all()
    )

    if not rows:
        return []

    counts: dict[str, int] = {}
    last_seen_by_country: dict[str, datetime] = {}

    for country_value, timestamp in rows:
        country = str(country_value or "NA")
        counts[country] = counts.get(country, 0) + 1
        if timestamp and (
            country not in last_seen_by_country or timestamp > last_seen_by_country[country]
        ):
            last_seen_by_country[country] = timestamp

    total_impossible_events = len(rows)

    return [
        {
            "country": country,
            "count": count,
            "percentage": round((count / total_impossible_events) * 100, 1),
            "last_seen": _iso(last_seen_by_country.get(country)),
        }
        for country, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)
    ]


@router.get("/analytics/threat-velocity")
def analytics_threat_velocity(db: Annotated[Session, Depends(get_db)], hours: int = 12, buckets: int = 12):
    """
    Calculate threat ingress velocity over time.
    Groups events into N time buckets over the last M hours.
    Returns event count and aggregate risk per bucket for visualization.
    """
    from datetime import timedelta
    
    # Get events from the last N hours
    MAX_BUCKETS = 50
    MAX_HOURS = 168
    safe_buckets = min(max(buckets, 1), MAX_BUCKETS)
    safe_hours = min(max(hours, 1), MAX_HOURS)
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=safe_hours)
    events = db.query(LoginEvent).filter(LoginEvent.timestamp >= cutoff_time).all()
    
    if not events:
        # Return empty buckets if no events
        return [
            {
                "bucket": i,
                "start_time": _iso(cutoff_time + timedelta(hours=safe_hours/safe_buckets * i)),
                "end_time": _iso(cutoff_time + timedelta(hours=safe_hours/safe_buckets * (i + 1))),
                "event_count": 0,
                "total_risk": 0,
                "avg_risk": 0,
            }
            for i in range(safe_buckets)
        ]
    
    # Create time buckets
    min_time = min(e.timestamp for e in events)
    max_time = max(e.timestamp for e in events)
    
    if min_time == max_time:
        # All events at same time, put in middle bucket
        bucket_duration = timedelta(hours=safe_hours / safe_buckets)
        start_time = datetime.now(timezone.utc) - timedelta(hours=safe_hours)
        buckets_data = [
            {
                "bucket": i,
                "start_time": _iso(start_time + bucket_duration * i),
                "end_time": _iso(start_time + bucket_duration * (i + 1)),
                "event_count": 0,
                "total_risk": 0,
                "avg_risk": 0,
            }
            for i in range(safe_buckets)
        ]
        # Put all events in middle bucket
        middle = safe_buckets // 2
        total_risk = sum(e.risk_score for e in events)
        buckets_data[middle]["event_count"] = len(events)
        buckets_data[middle]["total_risk"] = total_risk
        buckets_data[middle]["avg_risk"] = round(total_risk / len(events), 1)
        return buckets_data
    
    # Distribute events into buckets based on timestamp
    bucket_duration = (max_time - min_time) / safe_buckets
    bucket_map: dict[int, list] = {i: [] for i in range(safe_buckets)}
    
    for event in events:
        if bucket_duration == timedelta(0):
            bucket_idx = safe_buckets // 2
        else:
            elapsed = event.timestamp - min_time
            bucket_idx = min(int(elapsed / bucket_duration), safe_buckets - 1)
        bucket_map[bucket_idx].append(event)
    
    # Build response
    start_time = datetime.now(timezone.utc) - timedelta(hours=safe_hours)
    bucket_duration_fixed = timedelta(hours=safe_hours / safe_buckets)
    
    result = []
    for i in range(safe_buckets):
        bucket_events = bucket_map[i]
        total_risk = sum(e.risk_score for e in bucket_events)
        result.append(
            {
                "bucket": i,
                "start_time": _iso(start_time + bucket_duration_fixed * i),
                "end_time": _iso(start_time + bucket_duration_fixed * (i + 1)),
                "event_count": len(bucket_events),
                "total_risk": total_risk,
                "avg_risk": round(total_risk / len(bucket_events), 1) if bucket_events else 0,
            }
        )
    
    return result


@router.get("/analytics/risky-users")
def analytics_risky_users(db: Annotated[Session, Depends(get_db)], limit: int = 10):
    events = db.query(LoginEvent).order_by(LoginEvent.risk_score.desc(), LoginEvent.id.desc()).limit(limit).all()
    return [
        {
            "username": event.username,
            "risk_score": event.risk_score,
            "event_action": event.event_action,
            "timestamp": _iso(event.timestamp),
        }
        for event in events
    ]


@router.get("/events/enriched")
def events_enriched(db: Annotated[Session, Depends(get_db)], limit: int = 50):
    events = db.query(LoginEvent).order_by(LoginEvent.id.desc()).limit(limit).all()
    triage_by_event = {
        item.event_id: item
        for item in db.query(EventTriage).filter(EventTriage.event_id.in_([event.id for event in events])).all()
    }

    payload = []
    for event in events:
        triage = triage_by_event.get(event.id)
        payload.append(
            {
                "id": event.id,
                "username": event.username,
                "ip_address": event.ip_address,
                "country": event.country,
                "event_action": event.event_action,
                "risk_score": event.risk_score,
                "is_suspicious": bool(event.is_suspicious),
                "device_fingerprint": event.device_fingerprint,
                "impossible_travel": bool(event.impossible_travel),
                "timestamp": _iso(event.timestamp),
                "triage": {
                    "status": triage.status if triage else "new",
                    "analyst": triage.analyst if triage else "unassigned",
                    "severity": triage.severity if triage else "medium",
                    "notes": triage.notes if triage else "",
                },
            }
        )
    return payload


@router.post("/events/{event_id}/triage", responses={404: {"description": "event not found"}})
def update_event_triage(event_id: int, body: EventTriageRequest, db: Annotated[Session, Depends(get_db)]):
    event = db.query(LoginEvent).filter(LoginEvent.id == event_id).one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="event not found")

    triage = db.query(EventTriage).filter(EventTriage.event_id == event_id).one_or_none()
    if triage is None:
        triage = EventTriage(event_id=event_id)
        db.add(triage)

    triage.status = body.status
    triage.analyst = body.analyst
    triage.severity = body.severity
    triage.notes = body.notes
    triage.updated_at = datetime.now().astimezone()
    db.commit()

    return {
        "event_id": event_id,
        "status": triage.status,
        "analyst": triage.analyst,
        "severity": triage.severity,
        "notes": triage.notes,
        "updated_at": _iso(triage.updated_at),
    }


@router.get("/cases")
def list_cases(db: Annotated[Session, Depends(get_db)], limit: int = 100):
    cases = db.query(IncidentCase).order_by(IncidentCase.id.desc()).limit(limit).all()

    case_ids = [case.id for case in cases]
    links = db.query(CaseEventLink).filter(CaseEventLink.case_id.in_(case_ids)).all() if case_ids else []
    event_map: dict[int, list[int]] = {}
    for link in links:
        event_map.setdefault(link.case_id, []).append(link.event_id)

    return [
        {
            "id": case.id,
            "title": case.title,
            "status": case.status,
            "priority": case.priority,
            "owner": case.owner,
            "summary": case.summary,
            "event_ids": event_map.get(case.id, []),
            "created_at": _iso(case.created_at),
            "updated_at": _iso(case.updated_at),
        }
        for case in cases
    ]


@router.post("/cases")
def create_case(body: CreateCaseRequest, db: Annotated[Session, Depends(get_db)]):
    item = IncidentCase(
        title=body.title,
        status=body.status,
        priority=body.priority,
        owner=body.owner,
        summary=body.summary,
        created_at=datetime.now().astimezone(),
        updated_at=datetime.now().astimezone(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    for event_id in body.event_ids:
        db.add(CaseEventLink(case_id=item.id, event_id=event_id))
    db.commit()

    return {"id": item.id, "title": item.title, "status": item.status, "priority": item.priority, "owner": item.owner}


@router.patch("/cases/{case_id}", responses={404: {"description": "case not found"}})
def update_case(case_id: int, body: UpdateCaseRequest, db: Annotated[Session, Depends(get_db)]):
    item = db.query(IncidentCase).filter(IncidentCase.id == case_id).one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="case not found")

    if body.status is not None:
        item.status = body.status
    if body.priority is not None:
        item.priority = body.priority
    if body.owner is not None:
        item.owner = body.owner
    if body.summary is not None:
        item.summary = body.summary

    item.updated_at = datetime.now().astimezone()
    db.commit()

    return {
        "id": item.id,
        "status": item.status,
        "priority": item.priority,
        "owner": item.owner,
        "summary": item.summary,
        "updated_at": _iso(item.updated_at),
    }


@router.get("/detection-rules")
def list_detection_rules(db: Annotated[Session, Depends(get_db)]):
    _seed_detection_rules(db)
    rules = db.query(DetectionRule).order_by(DetectionRule.id.asc()).all()
    return [
        {
            "id": rule.id,
            "key": rule.key,
            "name": rule.name,
            "description": rule.description,
            "threshold": rule.threshold,
            "enabled": bool(rule.enabled),
            "confidence": rule.confidence,
            "false_positive_rate": rule.false_positive_rate,
            "updated_at": _iso(rule.updated_at),
        }
        for rule in rules
    ]


@router.patch("/detection-rules/{rule_id}", responses={404: {"description": "rule not found"}})
def update_detection_rule(rule_id: int, body: DetectionRuleRequest, db: Annotated[Session, Depends(get_db)]):
    item = db.query(DetectionRule).filter(DetectionRule.id == rule_id).one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="rule not found")

    if body.threshold is not None:
        item.threshold = body.threshold
    if body.enabled is not None:
        item.enabled = body.enabled
    if body.confidence is not None:
        item.confidence = body.confidence
    if body.false_positive_rate is not None:
        item.false_positive_rate = body.false_positive_rate

    item.updated_at = datetime.now().astimezone()
    db.commit()

    return {
        "id": item.id,
        "threshold": item.threshold,
        "enabled": bool(item.enabled),
        "confidence": item.confidence,
        "false_positive_rate": item.false_positive_rate,
        "updated_at": _iso(item.updated_at),
    }


@router.get("/detection-rules/{rule_id}/backtest", responses={404: {"description": "rule not found"}})
def backtest_detection_rule(rule_id: int, db: Annotated[Session, Depends(get_db)], days: int = 30):
    item = db.query(DetectionRule).filter(DetectionRule.id == rule_id).one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="rule not found")

    sample_events = db.query(LoginEvent).order_by(LoginEvent.id.desc()).limit(500).all()
    hit_count = sum(1 for event in sample_events if event.risk_score >= int(item.threshold))
    total = len(sample_events)
    hit_rate = round((hit_count / total) if total else 0.0, 4)

    return {
        "rule_id": item.id,
        "days": days,
        "events_evaluated": total,
        "hits": hit_count,
        "hit_rate": hit_rate,
        "projected_false_positive_rate": item.false_positive_rate,
    }


@router.get("/policies")
def list_policies(db: Annotated[Session, Depends(get_db)]):
    defaults = [
        ("blocked_countries", "IR,SY,KP", "Comma separated country deny list"),
        ("password_spray_window_minutes", "15", "Window for spray detection"),
        ("password_spray_distinct_users_threshold", "5", "Distinct users threshold"),
        ("temporary_restriction_minutes", "30", "Duration of temporary restriction"),
        ("admin_console_risk_threshold", "0.85", "Risk threshold for UC-018"),
    ]

    for key, value, description in defaults:
        existing = db.query(SecurityPolicy).filter(SecurityPolicy.key == key).one_or_none()
        if existing:
            continue
        db.add(SecurityPolicy(key=key, value=value, description=description, updated_at=datetime.now().astimezone()))
    db.commit()

    rows = db.query(SecurityPolicy).order_by(SecurityPolicy.id.asc()).all()
    return [
        {
            "id": row.id,
            "key": row.key,
            "value": row.value,
            "description": row.description,
            "updated_at": _iso(row.updated_at),
        }
        for row in rows
    ]


@router.patch("/policies/{policy_id}", responses={404: {"description": "policy not found"}})
def update_policy(policy_id: int, body: PolicyRequest, db: Annotated[Session, Depends(get_db)]):
    item = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="policy not found")

    item.value = body.value
    item.updated_at = datetime.now().astimezone()
    db.commit()

    return {"id": item.id, "key": item.key, "value": item.value, "updated_at": _iso(item.updated_at)}


@router.get("/containment/tickets")
def list_tickets(db: Annotated[Session, Depends(get_db)], limit: int = 100):
    rows = db.query(ContainmentTicket).order_by(ContainmentTicket.id.desc()).limit(limit).all()
    return [
        {
            "id": row.id,
            "ticket_id": row.ticket_id,
            "entity": row.entity,
            "severity": row.severity,
            "status": row.status,
            "summary": row.summary,
            "source": row.source,
            "created_at": _iso(row.created_at),
            "updated_at": _iso(row.updated_at),
        }
        for row in rows
    ]


@router.post("/containment/tickets")
def create_ticket(body: CreateTicketRequest, db: Annotated[Session, Depends(get_db)]):
    serial = db.query(ContainmentTicket).count() + 1
    ticket_id = f"CT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{serial:04d}"

    row = ContainmentTicket(
        ticket_id=ticket_id,
        entity=body.entity,
        severity=body.severity,
        status="open",
        summary=body.summary,
        source=body.source,
        created_at=datetime.now().astimezone(),
        updated_at=datetime.now().astimezone(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"id": row.id, "ticket_id": row.ticket_id, "entity": row.entity, "severity": row.severity, "status": row.status}


@router.patch("/containment/tickets/{ticket_id}", responses={404: {"description": "ticket not found"}})
def update_ticket(ticket_id: int, status: str, db: Annotated[Session, Depends(get_db)]):
    row = db.query(ContainmentTicket).filter(ContainmentTicket.id == ticket_id).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="ticket not found")

    row.status = status
    row.updated_at = datetime.now().astimezone()
    db.commit()

    return {"id": row.id, "ticket_id": row.ticket_id, "status": row.status, "updated_at": _iso(row.updated_at)}


@router.get("/access-restrictions")
def list_access_restrictions(db: Annotated[Session, Depends(get_db)]):
    rows = db.query(AccessRestriction).order_by(AccessRestriction.id.desc()).all()
    return [
        {
            "id": row.id,
            "target_type": row.target_type,
            "target_value": row.target_value,
            "reason": row.reason,
            "active": bool(row.active),
            "expires_at": _iso(row.expires_at),
            "created_at": _iso(row.created_at),
        }
        for row in rows
    ]


@router.post("/access-restrictions", responses={400: {"description": "expires_at must be ISO format"}})
def create_access_restriction(body: RestrictionRequest, db: Annotated[Session, Depends(get_db)]):
    try:
        expires_at = datetime.fromisoformat(body.expires_at)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="expires_at must be ISO format") from exc

    row = AccessRestriction(
        target_type=body.target_type,
        target_value=body.target_value,
        reason=body.reason,
        active=True,
        expires_at=expires_at,
        created_at=datetime.now().astimezone(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {
        "id": row.id,
        "target_type": row.target_type,
        "target_value": row.target_value,
        "reason": row.reason,
        "active": bool(row.active),
        "expires_at": _iso(row.expires_at),
    }


@router.delete("/access-restrictions/{restriction_id}",responses={404: {"description": "Restriction not found"}})
def deactivate_access_restriction(restriction_id: int, db: Annotated[Session, Depends(get_db)]):
    row = db.query(AccessRestriction).filter(AccessRestriction.id == restriction_id).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="restriction not found")

    row.active = False
    db.commit()

    return {"id": row.id, "active": bool(row.active)}


@router.get("/reports/weekly")
def weekly_report(db: Annotated[Session, Depends(get_db)]):
    events = db.query(LoginEvent).all()
    mitigations = db.query(MitigationLog).all()

    action_counts: dict[str, int] = {}
    for event in events:
        action = str(event.event_action)
        action_counts[action] = action_counts.get(action, 0) + 1

    uc_counts: dict[str, int] = {}
    for mitigation in mitigations:
        uc = str(mitigation.uc_id)
        uc_counts[uc] = uc_counts.get(uc, 0) + 1

    return {
        "generated_at": _iso(datetime.now().astimezone()),
        "events_total": len(events),
        "mitigations_total": len(mitigations),
        "events_by_action": action_counts,
        "mitigations_by_uc": uc_counts,
    }


@router.get("/reports/export")
def report_export(db: Annotated[Session, Depends(get_db)], limit: int = 100):
    events = db.query(LoginEvent).order_by(LoginEvent.id.desc()).limit(limit).all()
    mitigations = db.query(MitigationLog).order_by(MitigationLog.id.desc()).limit(limit).all()

    return {
        "events": [
            {
                "id": event.id,
                "username": event.username,
                "event_action": event.event_action,
                "risk_score": event.risk_score,
                "timestamp": _iso(event.timestamp),
            }
            for event in events
        ],
        "mitigations": [
            {
                "id": item.id,
                "uc_id": item.uc_id,
                "target_identifier": item.target_identifier,
                "action": item.action,
                "status": item.status,
                "timestamp": _iso(item.timestamp),
            }
            for item in mitigations
        ],
    }


@router.get("/investigation/graph")
def investigation_graph(db: Annotated[Session, Depends(get_db)], limit: int = 200):
    events = db.query(LoginEvent).order_by(LoginEvent.id.desc()).limit(limit).all()

    user_nodes = {event.username for event in events}
    ip_nodes = {event.ip_address for event in events}

    nodes = ([{"id": f"user:{username}", "type": "user", "label": username} for username in user_nodes] + [{"id": f"ip:{ip}", "type": "ip", "label": ip} for ip in ip_nodes])

    edges = [
        {
            "id": f"event:{event.id}",
            "source": f"user:{event.username}",
            "target": f"ip:{event.ip_address}",
            "label": event.event_action,
            "risk_score": event.risk_score,
            "timestamp": _iso(event.timestamp),
        }
        for event in events
    ]

    return {"nodes": nodes, "edges": edges}


@router.get("/ingestion/health")
def ingestion_health(db: Annotated[Session, Depends(get_db)]):
    event_count = db.query(LoginEvent).count()
    mitigation_count = db.query(MitigationLog).count()
    restriction_count = db.query(AccessRestriction).count()

    return {
        "status": "healthy",
        "pipeline": "operational",
        "event_count": event_count,
        "mitigation_count": mitigation_count,
        "restriction_count": restriction_count,
        "last_checked": _iso(datetime.now().astimezone()),
    }
