from __future__ import annotations

import random
import time
from typing import Optional

import requests


def _post_login(
    base_url: str,
    username: str,
    password: str,
    ip: Optional[str] = None,
    country: Optional[str] = None,
    device_fingerprint: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    is_admin_console: bool = False,
    api_key_id: Optional[str] = None,
    api_key_compromised: bool = False,
    containment_entity: Optional[str] = None,
    seed_session: bool = False,
):
    headers = {}
    if ip:
        headers["X-Forwarded-For"] = ip
    if country:
        headers["X-Country"] = country
    if seed_session:
        headers["X-Seed-Session"] = "true"
    requests.post(
        f"{base_url}/login",
        json={
            "username": username,
            "password": password,
            "user_agent": "simulator",
            "device_fingerprint": device_fingerprint,
            "latitude": latitude,
            "longitude": longitude,
            "is_admin_console": is_admin_console,
            "api_key_id": api_key_id,
            "api_key_compromised": api_key_compromised,
            "containment_entity": containment_entity,
        },
        headers=headers,
        timeout=5,
    )


MALICIOUS_USERNAME = "Malicious Entity"
RUSSIAN_THREAT_ACTOR = "Russian Threat Actor"
SESSION_HIJACK_TEST_USER = "Session Hijack Tester"
IMPOSSIBLE_TRAVEL_TEST_USER = "Impossible Travel Tester"
SPRINT4_API_KEY_USER = "Sprint4 API Key User"
SPRINT4_ADMIN_USER = "Sprint4 Admin User"
SPRINT4_CONTAINMENT_USER = "Sprint4 Containment User"


def simulate_uc_012(base_url: str, username: str | None = None) -> None:
    target = username or MALICIOUS_USERNAME
    for idx in range(10):
        _post_login(base_url, username=target, password="wrong-password")
        if idx < 9:
            time.sleep(0)


def simulate_uc_013(base_url: str, username: str | None = None) -> None:
    target = username or RUSSIAN_THREAT_ACTOR
    _post_login(base_url, username=target, password="password123", ip="5.255.255.1", country="RU")


def simulate_uc_014(base_url: str, username: str | None = None) -> None:
    target = username or SESSION_HIJACK_TEST_USER
    _post_login(
        base_url,
        username=target,
        password="password123",
        device_fingerprint="device-old",
        seed_session=True,
    )
    time.sleep(0.5)
    _post_login(
        base_url,
        username=target,
        password="password123",
        device_fingerprint="device-new",
    )


def simulate_uc_015(base_url: str, username: str | None = None) -> None:
    target = username or IMPOSSIBLE_TRAVEL_TEST_USER
    far_locations = [
        ("US", "23.45.67.88", 40.7128, -74.0060),
        ("JP", "103.21.90.88", 35.6895, 139.6917),
        ("AU", "1.120.30.88", -33.8688, 151.2093),
        ("BR", "200.147.35.88", -23.5505, -46.6333),
        ("ZA", "41.13.90.88", -26.2041, 28.0473),
        ("CA", "24.140.10.88", 43.6532, -79.3832),
        ("DE", "91.65.88.88", 52.5200, 13.4050),
        ("GB", "81.2.69.88", 51.5072, -0.1276),
        ("PK", "39.45.120.88", 31.5204, 74.3587),
        ("SG", "103.53.80.88", 1.3521, 103.8198),
    ]

    first = random.choice(far_locations)
    second = random.choice([loc for loc in far_locations if loc != first])

    _post_login(
        base_url,
        username=target,
        password="password123",
        ip=first[1],
        country=first[0],
        device_fingerprint="device-a",
        latitude=first[2],
        longitude=first[3],
    )
    time.sleep(1)
    _post_login(
        base_url,
        username=target,
        password="password123",
        ip=second[1],
        country=second[0],
        device_fingerprint="device-a",
        latitude=second[2],
        longitude=second[3],
    )


def simulate_uc_016(base_url: str, username: str | None = None) -> None:
    target = username or SPRINT4_API_KEY_USER
    _post_login(
        base_url,
        username=target,
        password="wrong-password",
        api_key_id="sim-key-016",
        api_key_compromised=True,
    )


def simulate_uc_017(base_url: str, username: str | None = None) -> None:
    target = username or "Blocked Region Tester"
    _post_login(
        base_url,
        username=target,
        password="password123",
        ip="203.0.113.17",
        country="IR",
    )


def simulate_uc_018(base_url: str, username: str | None = None) -> None:
    target = username or SPRINT4_ADMIN_USER
    _post_login(
        base_url,
        username=target,
        password="wrong-password",
        is_admin_console=True,
    )


def simulate_uc_019(base_url: str, username: str | None = None) -> None:
    target = username or SPRINT4_CONTAINMENT_USER
    _post_login(
        base_url,
        username=target,
        password="wrong-password",
        containment_entity="ip:185.93.50.10",
    )


def simulate_uc_020(base_url: str, username: str | None = None) -> None:
    target = username or "Password Spray Tester"
    source_ip = "203.0.113.20"
    for idx in range(6):
        _post_login(
            base_url,
            username=f"{target}-{idx}",
            password="wrong-password",
            ip=source_ip,
            country="PK",
        )
    _post_login(
        base_url,
        username=f"{target}-final",
        password="password123",
        ip=source_ip,
        country="PK",
    )
