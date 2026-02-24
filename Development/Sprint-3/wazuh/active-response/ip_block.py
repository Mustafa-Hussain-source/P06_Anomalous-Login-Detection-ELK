from __future__ import annotations

import json
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path


def _read_alert() -> dict:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def _extract_ip(alert: dict) -> str | None:
    for key in ("srcip", "ip", "ip_address"):
        value = alert.get(key)
        if isinstance(value, str) and value:
            return value
    data = alert.get("data") or {}
    for key in ("srcip", "ip", "ip_address"):
        value = data.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def _get_db_path() -> Path:
    env_value = os.getenv("ALDS_DB_PATH")
    if env_value:
        return Path(env_value)
    return Path(__file__).resolve().parents[2] / "alds.db"


def main() -> int:
    alert = _read_alert()
    ip = _extract_ip(alert)
    if not ip:
        print(json.dumps({"status": "fail", "reason": "ip missing"}))
        return 1

    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            "INSERT OR IGNORE INTO ip_blacklist (ip_address, reason, timestamp) VALUES (?, ?, ?)",
            (ip, "UC-013 geofencing", datetime.now().isoformat()),
        )
        conn.execute(
            """
            INSERT INTO mitigation_log (uc_id, target_identifier, action, status, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("UC-013", ip, "ip_block", "success", datetime.now().isoformat()),
        )
        conn.commit()
        print(json.dumps({"status": "success", "action": "ip_block", "ip": ip}))
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
