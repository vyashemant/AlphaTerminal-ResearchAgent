import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.config import settings
import logging

client = TestClient(app)

def test_health_check():
    """Verify liveness endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_readiness_check():
    """Verify readiness endpoint checks database."""
    # Force settings to mock to ensure database is ready
    original_backend = settings.DATABASE_BACKEND
    try:
        settings.DATABASE_BACKEND = "mock"
        response = client.get("/ready")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    finally:
        settings.DATABASE_BACKEND = original_backend

def test_readiness_check_failure(monkeypatch):
    """Verify readiness returns 503 when DB fails."""
    import db.database as db
    from db.database import PersistenceError

    def mock_get_db(*args, **kwargs):
        raise PersistenceError("Simulated DB failure")
    
    monkeypatch.setattr(db, "get_db", mock_get_db)

    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "detail": "Simulated DB failure"}

def test_global_exception_handler(monkeypatch):
    """Verify global exception handler catches unhandled errors and returns 500."""
    from api.main import api_router
    from fastapi import APIRouter

    # Add a temporary route that raises an exception
    router = APIRouter()
    @router.get("/trigger_error")
    def trigger_error():
        raise ValueError("Simulated unexpected error")
    
    app.include_router(router)

    response = client.get("/trigger_error")
    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}

def test_config_validation():
    """Verify config validation logic."""
    from api.config import Settings
    from pydantic import ValidationError

    # valid mock config
    Settings(DATABASE_BACKEND="mock")
    
    # valid sqlite config
    Settings(DATABASE_BACKEND="sqlite")

    # valid supabase config
    Settings(
        DATABASE_BACKEND="supabase",
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SECRET_KEY="testkey"
    )

    # missing supabase credentials
    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_SECRET_KEY are required"):
        Settings(DATABASE_BACKEND="supabase", SUPABASE_URL="", SUPABASE_SECRET_KEY="")
