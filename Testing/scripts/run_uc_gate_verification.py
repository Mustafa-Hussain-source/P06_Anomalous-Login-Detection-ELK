from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


BASE_URL = os.getenv("SENTINELAUTH_BASE_URL", "http://127.0.0.1:8000")
ROOT = Path(__file__).resolve().parents[3]
RESULTS_DIR = ROOT / "Testing" / "results"


@dataclass
class CheckResult:
    uc_id: str
    action: str
    passed: bool
    detail: str


def _request(method: str, path: str, **kwargs: Any) -> requests.Response:
    url = f"{BASE_URL}{path}"
    response = requests.request(method=method, url=url, timeout=15, **kwargs)
    response.raise_for_status()
    return response


def _wait(seconds: float = 1.0) -> None:
    time.sleep(seconds)


def _count_matching(items: list[dict[str, Any]], key: str, expected: str) -> int:
    return sum(1 for item in items if str(item.get(key, "")) == expected)


def run_gate() -> dict[str, Any]:
    checks: list[CheckResult] = []

    _request("POST", "/events/clear?seed=true")
    _request("POST", "/traffic/stop")

    # UC-012..UC-020 simulation checks.
    uc_paths = [
        "uc-012",
        "uc-013",
        "uc-014",
        "uc-015",
        "uc-016",
        "uc-017",
        "uc-018",
        "uc-019",
        "uc-020",
    ]

    for uc in uc_paths:
        _request("POST", f"/simulate/{uc}")
        _wait(1.0)

    _wait(2.0)

    events = _request("GET", "/events?limit=500").json()
    mitigations = _request("GET", "/mitigations?limit=500").json()
    evidence = _request("GET", "/sprint4/evidence?limit=500").json()

    expected_actions = {
        "UC-012": "account_lock",
        "UC-013": "ip_block",
        "UC-014": "session_kill",
        "UC-015": "mfa_stepup",
        "UC-016": "api_key_revoke",
        "UC-017": "region_block",
        "UC-018": "admin_console_block",
        "UC-019": "containment_ticket_create",
        "UC-020": "temporary_access_restriction",
    }

    for uc_id, action in expected_actions.items():
        count = sum(
            1
            for row in mitigations
            if str(row.get("uc_id")) == uc_id and str(row.get("action")) == action
        )
        checks.append(
            CheckResult(
                uc_id=uc_id,
                action=action,
                passed=count > 0,
                detail=f"found={count}",
            )
        )

    # UC-008: triage workflow
    enriched = _request("GET", "/events/enriched?limit=50").json()
    if enriched:
        event_id = int(enriched[0]["id"])
        triage_payload = {
            "status": "in_review",
            "analyst": "gate-runner",
            "severity": "high",
            "notes": "UC-008 verification",
        }
        _request("POST", f"/events/{event_id}/triage", json=triage_payload)
        enriched_after = _request("GET", "/events/enriched?limit=50").json()
        triage_ok = any(
            int(item["id"]) == event_id and item.get("triage", {}).get("status") == "in_review"
            for item in enriched_after
        )
        checks.append(CheckResult("UC-008", "triage_update", triage_ok, f"event_id={event_id}"))
    else:
        checks.append(CheckResult("UC-008", "triage_update", False, "no events available"))

    # UC-009: containment workflow
    ticket_response = _request(
        "POST",
        "/containment/tickets",
        json={"entity": "ip:185.93.50.10", "severity": "critical", "summary": "UC-009 verification"},
    ).json()
    ticket_id = int(ticket_response["id"])
    close_response = _request("PATCH", f"/containment/tickets/{ticket_id}?status=closed").json()
    checks.append(
        CheckResult(
            "UC-009",
            "containment_ticket_lifecycle",
            str(close_response.get("status")) == "closed",
            f"ticket_id={ticket_id}",
        )
    )

    # UC-010: detection tuning workflow
    rules = _request("GET", "/detection-rules").json()
    if rules:
        first_rule_id = int(rules[0]["id"])
        _request("PATCH", f"/detection-rules/{first_rule_id}", json={"threshold": 42.0})
        backtest = _request("GET", f"/detection-rules/{first_rule_id}/backtest?days=7").json()
        checks.append(
            CheckResult(
                "UC-010",
                "detection_rule_tuning",
                "hit_rate" in backtest,
                f"rule_id={first_rule_id}",
            )
        )
    else:
        checks.append(CheckResult("UC-010", "detection_rule_tuning", False, "no rules seeded"))

    # UC-006 remains document-driven in current codebase.
    checks.append(
        CheckResult(
            "UC-006",
            "specification_traceability",
            True,
            "Documented/manual validation in sprint gate docs",
        )
    )

    report_weekly = _request("GET", "/reports/weekly").json()
    report_export = _request("GET", "/reports/export?limit=120").json()
    kpi = _request("GET", "/analytics/kpi").json()
    graph = _request("GET", "/investigation/graph?limit=120").json()
    health = _request("GET", "/ingestion/health").json()
    cases = _request("GET", "/cases?limit=120").json()
    tickets = _request("GET", "/containment/tickets?limit=120").json()

    passed = [item for item in checks if item.passed]
    failed = [item for item in checks if not item.passed]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": BASE_URL,
        "summary": {
            "total_checks": len(checks),
            "passed": len(passed),
            "failed": len(failed),
        },
        "checks": [item.__dict__ for item in checks],
        "artifacts": {
            "events_count": len(events),
            "mitigations_count": len(mitigations),
            "evidence_count": len(evidence),
            "cases_count": len(cases),
            "tickets_count": len(tickets),
            "kpi": kpi,
            "weekly_report": report_weekly,
            "export_snapshot_sizes": {
                "events": len(report_export.get("events", [])),
                "mitigations": len(report_export.get("mitigations", [])),
            },
            "graph_sizes": {
                "nodes": len(graph.get("nodes", [])),
                "edges": len(graph.get("edges", [])),
            },
            "health": health,
        },
    }


def persist_output(payload: dict[str, Any]) -> tuple[Path, Path]:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = RESULTS_DIR / f"uc_gate_run_{stamp}.json"
    md_path = RESULTS_DIR / f"uc_gate_run_{stamp}.md"

    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [
        "# UC Gate Verification Run",
        "",
        f"Generated: {payload['generated_at']}",
        f"Base URL: {payload['base_url']}",
        "",
        "## Summary",
        "",
        f"- Total checks: {payload['summary']['total_checks']}",
        f"- Passed: {payload['summary']['passed']}",
        f"- Failed: {payload['summary']['failed']}",
        "",
        "## Checks",
        "",
        "| UC | Action | Passed | Detail |",
        "|---|---|---|---|",
    ]

    for item in payload["checks"]:
        lines.append(f"| {item['uc_id']} | {item['action']} | {item['passed']} | {item['detail']} |")

    lines.extend(
        [
            "",
            "## Artifact Sizes",
            "",
            f"- Events: {payload['artifacts']['events_count']}",
            f"- Mitigations: {payload['artifacts']['mitigations_count']}",
            f"- Evidence: {payload['artifacts']['evidence_count']}",
            f"- Cases: {payload['artifacts']['cases_count']}",
            f"- Tickets: {payload['artifacts']['tickets_count']}",
            f"- Graph nodes: {payload['artifacts']['graph_sizes']['nodes']}",
            f"- Graph edges: {payload['artifacts']['graph_sizes']['edges']}",
            "",
            "## Notes",
            "",
            "- UC-006 is represented as a documentation/specification gate in current implementation.",
            "- Runtime checks executed for UC-008/009/010 and UC-012..020.",
        ]
    )

    md_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, md_path


if __name__ == "__main__":
    report = run_gate()
    json_file, md_file = persist_output(report)
    print(f"Wrote gate report JSON: {json_file}")
    print(f"Wrote gate report MD: {md_file}")
    print(json.dumps(report["summary"], indent=2))
