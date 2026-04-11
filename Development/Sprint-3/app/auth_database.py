from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parents[1]
AUTH_DB_PATH = BASE_DIR / "sentinelauth_auth.db"
AUTH_DATABASE_URL = f"sqlite:///{AUTH_DB_PATH}"

auth_engine = create_engine(
    AUTH_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

AuthSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=auth_engine)


def get_auth_db():
    db = AuthSessionLocal()
    try:
        yield db
    finally:
        db.close()
