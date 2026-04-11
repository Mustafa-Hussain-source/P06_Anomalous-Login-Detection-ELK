from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class MitigationResult:
    uc_id: str
    action: str
    status: str
    reason: str
    timestamp: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Sprint4AutomationEngine:
    """Implements UC-016/018/019 and writes verifiable mitigation evidence."""

    def __init__(self, evidence_file: str | Path = "sprint4_mitigation_evidence.jsonl") -> None:
        self.evidence_file = Path(evidence_file)
        self.revoked_api_keys: set[tuple[str, str]] = set()
        self.blocked_admin_users: set[str] = set()
        self.tickets: list[dict[str, Any]] = []

    def _append_evidence(
        self,
        uc_id: str,
        event: str,
        action: str,
        status: str,
        details: dict[str, Any],
    ) -> None:
        self.evidence_file.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "uc_id": uc_id,
            "event": event,
            "action": action,
            "status": status,
            "timestamp": _now_iso(),
            "details": details,
        }
        with self.evidence_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    def uc_016_revoke_api_key(self, user_id: str, api_key_id: str, compromised: bool) -> MitigationResult:
        if not user_id or not api_key_id:
            return MitigationResult(
                uc_id="UC-016",
                action="api_key_revoke",
                status="failed",
                reason="Missing user_id or api_key_id",
                timestamp=_now_iso(),
            )

        if not compromised:
            result = MitigationResult(
                uc_id="UC-016",
                action="api_key_revoke",
                status="skipped",
                reason="No compromise signal",
                timestamp=_now_iso(),
            )
            self._append_evidence(
                uc_id="UC-016",
                event="api_key_compromise_assessment",
                action="api_key_revoke",
                status="skipped",
                details={"user_id": user_id, "api_key_id": api_key_id, "compromised": compromised},
            )
            return result

        key_ref = (user_id, api_key_id)
        if key_ref in self.revoked_api_keys:
            result = MitigationResult(
                uc_id="UC-016",
                action="api_key_revoke",
                status="success",
                reason=f"API key already revoked for user={user_id}, key={api_key_id}",
                timestamp=_now_iso(),
            )
            self._append_evidence(
                uc_id="UC-016",
                event="compromised_api_key_detected",
                action="api_key_revoke",
                status="already_applied",
                details={"user_id": user_id, "api_key_id": api_key_id},
            )
            return result

        self.revoked_api_keys.add(key_ref)
        result = MitigationResult(
            uc_id="UC-016",
            action="api_key_revoke",
            status="success",
            reason=f"Compromised key revoked for user={user_id}, key={api_key_id}",
            timestamp=_now_iso(),
        )
        self._append_evidence(
            uc_id="UC-016",
            event="compromised_api_key_detected",
            action="api_key_revoke",
            status="success",
            details={"user_id": user_id, "api_key_id": api_key_id},
        )
        return result

    def uc_018_block_admin_login(
        self,
        username: str,
        is_admin_console: bool,
        risk_score: float,
        threshold: float = 0.85,
    ) -> MitigationResult:
        if not username:
            return MitigationResult(
                uc_id="UC-018",
                action="admin_console_block",
                status="failed",
                reason="Missing username",
                timestamp=_now_iso(),
            )

        should_block = is_admin_console and risk_score >= threshold
        if not should_block:
            result = MitigationResult(
                uc_id="UC-018",
                action="admin_console_block",
                status="skipped",
                reason="Risk threshold not met or not admin console",
                timestamp=_now_iso(),
            )
            self._append_evidence(
                uc_id="UC-018",
                event="admin_console_login_assessment",
                action="admin_console_block",
                status="skipped",
                details={
                    "username": username,
                    "is_admin_console": is_admin_console,
                    "risk_score": risk_score,
                    "threshold": threshold,
                },
            )
            return result

        self.blocked_admin_users.add(username)
        result = MitigationResult(
            uc_id="UC-018",
            action="admin_console_block",
            status="success",
            reason=f"Admin login blocked for username={username}, risk={risk_score}",
            timestamp=_now_iso(),
        )
        self._append_evidence(
            uc_id="UC-018",
            event="high_risk_admin_console_login",
            action="admin_console_block",
            status="success",
            details={"username": username, "risk_score": risk_score, "threshold": threshold},
        )
        return result

    def uc_019_create_containment_ticket(
        self,
        entity: str,
        severity: str,
        context: dict[str, Any],
    ) -> MitigationResult:
        if not entity:
            return MitigationResult(
                uc_id="UC-019",
                action="containment_ticket_create",
                status="failed",
                reason="Missing entity",
                timestamp=_now_iso(),
            )

        normalized_severity = severity.lower().strip() if severity else "medium"
        if normalized_severity not in {"low", "medium", "high", "critical"}:
            normalized_severity = "medium"

        ticket_id = f"CT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{len(self.tickets) + 1:04d}"
        ticket_summary = f"Containment required for {entity} with severity={normalized_severity}"
        ticket = {
            "ticket_id": ticket_id,
            "summary": ticket_summary,
            "entity": entity,
            "severity": normalized_severity,
            "context": context,
            "created_at": _now_iso(),
        }
        self.tickets.append(ticket)

        self._append_evidence(
            uc_id="UC-019",
            event="containment_required",
            action="containment_ticket_create",
            status="success",
            details={"ticket_id": ticket_id, "entity": entity, "severity": normalized_severity},
        )

        return MitigationResult(
            uc_id="UC-019",
            action="containment_ticket_create",
            status="success",
            reason=f"{ticket_summary}; ticket_id={ticket_id}",
            timestamp=_now_iso(),
        )

    def run_uc_action(self, uc_id: str, payload: dict[str, Any]) -> MitigationResult:
        if uc_id == "UC-016":
            return self.uc_016_revoke_api_key(
                user_id=str(payload.get("user_id", "")).strip(),
                api_key_id=str(payload.get("api_key_id", "")).strip(),
                compromised=bool(payload.get("compromised", False)),
            )

        if uc_id == "UC-018":
            return self.uc_018_block_admin_login(
                username=str(payload.get("username", "")).strip(),
                is_admin_console=bool(payload.get("is_admin_console", False)),
                risk_score=float(payload.get("risk_score", 0.0)),
                threshold=float(payload.get("threshold", 0.85)),
            )

        if uc_id == "UC-019":
            return self.uc_019_create_containment_ticket(
                entity=str(payload.get("entity", "")).strip(),
                severity=str(payload.get("severity", "medium")),
                context=dict(payload.get("context", {})),
            )

        return MitigationResult(
            uc_id=uc_id,
            action="unsupported",
            status="failed",
            reason="Unsupported UC id",
            timestamp=_now_iso(),
        )


def _parse_payload(payload_json: str | None, payload_file: str | None) -> dict[str, Any]:
    if payload_json:
        return dict(json.loads(payload_json))
    if payload_file:
        with Path(payload_file).open("r", encoding="utf-8") as handle:
            return dict(json.load(handle))
    return {}


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run Sprint-4 automated mitigation UCs.")
    parser.add_argument("--uc-id", help="UC to execute: UC-016, UC-018, UC-019")
    parser.add_argument("--payload-json", help="JSON payload string for the UC", default=None)
    parser.add_argument("--payload-file", help="Path to JSON payload file", default=None)
    parser.add_argument(
        "--evidence-file",
        help="Path to mitigation evidence JSONL output",
        default="sprint4_mitigation_evidence.jsonl",
    )
    return parser


if __name__ == "__main__":
    args = _build_arg_parser().parse_args()
    engine = Sprint4AutomationEngine(evidence_file=args.evidence_file)

    if args.uc_id:
        payload = _parse_payload(args.payload_json, args.payload_file)
        result = engine.run_uc_action(args.uc_id, payload)
        print(json.dumps(asdict(result), ensure_ascii=False))
    else:
        samples = [
            ("UC-016", {"user_id": "u-101", "api_key_id": "k-123", "compromised": True}),
            ("UC-018", {"username": "admin.alice", "is_admin_console": True, "risk_score": 0.92}),
            ("UC-019", {"entity": "admin.alice", "severity": "high", "context": {"source": "siem"}}),
        ]
        for uc, data in samples:
            result = engine.run_uc_action(uc, data)
            print(json.dumps(asdict(result), ensure_ascii=False))
