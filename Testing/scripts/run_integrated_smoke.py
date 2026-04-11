from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


BACKEND_URL = os.getenv("SENTINELAUTH_BASE_URL", "http://127.0.0.1:8010")
FRONTEND_URL = os.getenv("SENTINELAUTH_FRONTEND_URL", "http://127.0.0.1:4173")
ROOT = Path(__file__).resolve().parents[3]
RESULTS_DIR = ROOT / "Testing" / "results"


def check_backend(path: str) -> dict[str, Any]:
    url = f"{BACKEND_URL}{path}"
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return {"url": url, "status_code": response.status_code, "json": response.json()}


def check_frontend() -> dict[str, Any]:
    response = requests.get(FRONTEND_URL, timeout=15)
    response.raise_for_status()
    body = response.text
    return {
        "url": FRONTEND_URL,
        "status_code": response.status_code,
        "content_length": len(body),
        "has_root_div": '<div id="root"></div>' in body,
    }


def run_smoke() -> dict[str, Any]:
    frontend = check_frontend()
    ingestion = check_backend('/ingestion/health')
    kpi = check_backend('/analytics/kpi')
    weekly = check_backend('/reports/weekly')

    checks = [
        {
            "name": "frontend_served",
            "passed": frontend["status_code"] == 200 and frontend["content_length"] > 100,
            "detail": f"status={frontend['status_code']} length={frontend['content_length']}",
        },
        {
            "name": "backend_ingestion_health",
            "passed": ingestion["json"].get("status") == "healthy",
            "detail": f"status={ingestion['json'].get('status')}",
        },
        {
            "name": "backend_kpi_payload",
            "passed": "total_events" in kpi["json"] and "avg_risk" in kpi["json"],
            "detail": f"keys={sorted(kpi['json'].keys())[:5]}",
        },
        {
            "name": "backend_weekly_payload",
            "passed": "events_total" in weekly["json"] and "mitigations_total" in weekly["json"],
            "detail": f"events_total={weekly['json'].get('events_total')}",
        },
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "backend_url": BACKEND_URL,
        "frontend_url": FRONTEND_URL,
        "summary": {
            "total_checks": len(checks),
            "passed": sum(1 for item in checks if item["passed"]),
            "failed": sum(1 for item in checks if not item["passed"]),
        },
        "checks": checks,
        "snapshots": {
            "frontend": frontend,
            "ingestion_health": ingestion,
            "kpi": kpi,
            "weekly_report": weekly,
        },
    }


def persist(payload: dict[str, Any]) -> tuple[Path, Path]:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = RESULTS_DIR / f"integrated_smoke_{stamp}.json"
    md_path = RESULTS_DIR / f"integrated_smoke_{stamp}.md"

    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [
        "# Integrated Backend + Frontend Smoke Run",
        "",
        f"Generated: {payload['generated_at']}",
        f"Backend: {payload['backend_url']}",
        f"Frontend: {payload['frontend_url']}",
        "",
        "## Summary",
        "",
        f"- Total checks: {payload['summary']['total_checks']}",
        f"- Passed: {payload['summary']['passed']}",
        f"- Failed: {payload['summary']['failed']}",
        "",
        "## Checks",
        "",
        "| Name | Passed | Detail |",
        "|---|---|---|",
    ]

    for check in payload["checks"]:
        lines.append(f"| {check['name']} | {check['passed']} | {check['detail']} |")

    md_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, md_path


if __name__ == "__main__":
    report = run_smoke()
    json_file, md_file = persist(report)
    print(f"Wrote integrated JSON: {json_file}")
    print(f"Wrote integrated MD: {md_file}")
    print(json.dumps(report["summary"], indent=2))
