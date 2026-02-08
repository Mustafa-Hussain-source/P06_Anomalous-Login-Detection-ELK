from __future__ import annotations

import itertools
import sqlite3
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "alds.db"

USER_AGENTS = ["chrome", "firefox", "edge", "safari"]

COUNTRY_USERS = {
    "PK": ["ahmed.khan", "fatima.ali", "muhammad.siddiq", "aisha.hameed", "usman.raj"],
    "IN": ["arjun.malhotra", "ananya.rao", "rohan.verma", "isha.shah", "kabir.jain"],
    "BD": ["rahim.uddin", "tasnim.ahmed", "farhan.islam", "nusaiba.khan", "mahmud.haque"],
    "AE": ["omar.saif", "layla.amin", "kareem.nasser", "noor.abbas", "sara.hadi"],
    "SA": ["faisal.ali", "noura.salem", "khalid.rahman", "rana.mansour", "yasmin.hassan"],
    "TR": ["emre.yildiz", "ayse.kaya", "mehmet.demir", "elif.arslan", "cagla.oz"],
    "GB": ["oliver.hughes", "amelia.clark", "noah.bennett", "isla.carter", "harry.parker"],
    "US": ["ethan.hughes", "ava.morgan", "liam.brooks", "mia.jenkins", "logan.reed"],
    "CA": ["liam.boucher", "emma.larson", "noah.martin", "chloe.roy", "owen.carter"],
    "DE": ["lena.fischer", "felix.wagner", "hannah.schmidt", "jonas.keller", "lea.hoffmann"],
    "FR": ["lucas.bernard", "emma.dupont", "hugo.leroy", "claire.moreau", "leo.garnier"],
    "AU": ["jack.thompson", "olivia.mitchell", "noah.wright", "amelia.collins", "luca.turner"],
    "ZA": ["thabo.ndlovu", "lerato.mokoena", "sipho.zuma", "ayanda.khumalo", "amanda.vanwyk"],
}

IP_PREFIXES = {
    "PK": "39.45.120.",
    "IN": "103.21.90.",
    "BD": "103.53.80.",
    "AE": "185.93.50.",
    "SA": "95.177.10.",
    "TR": "78.186.120.",
    "GB": "81.2.69.",
    "US": "23.45.67.",
    "CA": "24.140.10.",
    "DE": "91.65.88.",
    "FR": "62.210.12.",
    "AU": "1.120.30.",
    "ZA": "41.13.90.",
}


def _iter_ips(prefix: str) -> itertools.cycle:
    octets = [str(i) for i in range(11, 255)]
    return itertools.cycle([f"{prefix}{o}" for o in octets])


def build_seed_payloads():
    users_payload = []
    events_payload = []
    users_payload.append(("unknown", "hash:password123"))

    for country, names in COUNTRY_USERS.items():
        ip_iter = _iter_ips(IP_PREFIXES[country])
        for idx, username in enumerate(names):
            users_payload.append((username, "hash:password123"))
            ip_address = next(ip_iter)
            user_agent = USER_AGENTS[idx % len(USER_AGENTS)]
            is_suspicious = 1 if idx == len(names) - 1 else 0
            risk_score = 80 if is_suspicious else 5
            event_action = "login_failure" if is_suspicious else "login_success"
            event_username = "unknown" if is_suspicious else username
            events_payload.append(
                (
                    event_username,
                    ip_address,
                    user_agent,
                    country,
                    is_suspicious,
                    risk_score,
                    event_action,
                    datetime.now(),
                )
            )

    return users_payload, events_payload


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("DELETE FROM login_events")
        conn.execute("DELETE FROM mitigation_log")
        conn.execute("DELETE FROM active_sessions")
        conn.execute("DELETE FROM ip_blacklist")
        conn.execute("DELETE FROM users")

        users_payload, events_payload = build_seed_payloads()
        events_payload = [
            (
                username,
                ip_address,
                user_agent,
                country,
                is_suspicious,
                risk_score,
                event_action,
                timestamp.isoformat(),
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
            ) in events_payload
        ]

        conn.executemany(
            "INSERT INTO users (username, password_hash, is_locked, mfa_required) VALUES (?, ?, 0, 0)",
            users_payload,
        )
        conn.executemany(
            """
            INSERT INTO login_events (
                username, ip_address, user_agent, country, is_suspicious, risk_score, event_action, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            events_payload,
        )
        conn.commit()
        print(f"Seeded {len(users_payload)} users across {len(COUNTRY_USERS)} countries.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
