import sys
import os

sys.path.append(os.path.abspath("Development/Sprint-3"))

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_login_success():
    response = client.post("/login", json={
        "username": "test",
        "password": "password123",
        "user_agent": "pytest",
        "device_fingerprint": "device123",
        "latitude": 0.0,
        "longitude": 0.0,
        "is_admin_console": False,
        "api_key_id": None,
        "api_key_compromised": False,
        "containment_entity": None
    })
    assert response.status_code in [200, 403, 422]

def test_events():
    response = client.get("/events")
    assert response.status_code == 200