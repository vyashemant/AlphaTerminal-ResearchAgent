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
        assert response.json() == {"status": "ready"}
    finally:
        settings.DATABASE_BACKEND = original_backend

def test_readiness_check_failure(monkeypatch):
    """Verify readiness returns 503 and unavailable status when DB fails."""
    import db.database as db

    def mock_health_check(*args, **kwargs):
        raise db.PersistenceError("Simulated DB failure")
    
    monkeypatch.setattr(db, "health_check", mock_health_check)

    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "detail": "Database unavailable"}

def test_mock_backend_health_check():
    """Verify MockBackend health_check behavior."""
    from db.database import MockBackend, PersistenceError
    backend = MockBackend()
    assert backend.health_check() is True

    backend._is_healthy = False
    with pytest.raises(PersistenceError, match="Mock database health check failed"):
        backend.health_check()

def test_sqlite_backend_health_check(tmp_path):
    """Verify SQLiteBackend health_check performs SELECT 1 successfully."""
    from db.database import SQLiteBackend
    db_file = str(tmp_path / "test_health.db")
    backend = SQLiteBackend()
    backend.init_db(db_file)
    assert backend.health_check() is True

def test_supabase_backend_health_check_success():
    """Verify SupabaseBackend.health_check queries research_jobs without real credentials."""
    from unittest.mock import MagicMock, patch
    from db.database import SupabaseBackend

    with patch.object(SupabaseBackend, "_initialize_client"):
        backend = SupabaseBackend()

    mock_client = MagicMock()
    mock_table = MagicMock()
    mock_select = MagicMock()
    mock_limit = MagicMock()

    mock_client.table.return_value = mock_table
    mock_table.select.return_value = mock_select
    mock_select.limit.return_value = mock_limit
    mock_limit.execute.return_value = MagicMock(data=[{"job_id": "test-uuid"}])

    backend._client = mock_client

    result = backend.health_check()
    assert result is True

    mock_client.table.assert_called_once_with("research_jobs")
    mock_table.select.assert_called_once_with("job_id")
    mock_select.limit.assert_called_once_with(1)
    mock_limit.execute.assert_called_once()

def test_supabase_backend_health_check_failure():
    """Verify SupabaseBackend.health_check raises PersistenceError when query fails."""
    from unittest.mock import MagicMock, patch
    from db.database import SupabaseBackend, PersistenceError

    with patch.object(SupabaseBackend, "_initialize_client"):
        backend = SupabaseBackend()

    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.limit.return_value.execute.side_effect = Exception("Connection timed out")

    backend._client = mock_client

    with pytest.raises(PersistenceError, match="Supabase health_check failed"):
        backend.health_check()

def test_global_exception_handler(monkeypatch):
    """Verify global exception handler catches unhandled errors and returns 500."""
    from fastapi import APIRouter
    from fastapi.testclient import TestClient
    from api.main import app

    safe_client = TestClient(app, raise_server_exceptions=False)

    # Add a temporary route that raises an exception
    router = APIRouter()
    @router.get("/trigger_error")
    def trigger_error():
        raise ValueError("Simulated unexpected error")
    
    app.include_router(router)

    response = safe_client.get("/trigger_error")
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

def test_cors_origins_parsing():
    """Verify CORS origins can be parsed from json strings or comma-separated lists."""
    from api.config import Settings
    
    # default
    s1 = Settings(DATABASE_BACKEND="mock")
    assert "http://localhost:5173" in s1.CORS_ORIGINS

    # json list string
    s2 = Settings(DATABASE_BACKEND="mock", CORS_ORIGINS='["https://alpha.com", "https://beta.com"]')
    assert s2.CORS_ORIGINS == ["https://alpha.com", "https://beta.com"]

    # comma separated string
    s3 = Settings(DATABASE_BACKEND="mock", CORS_ORIGINS="https://gamma.com,https://delta.com")
    assert s3.CORS_ORIGINS == ["https://gamma.com", "https://delta.com"]

def test_cors_origins_wildcard_rejection():
    """Verify wildcard '*' is rejected in CORS_ORIGINS for security."""
    from api.config import Settings
    
    with pytest.raises(ValueError, match="Wildcard '\\*' is not permitted"):
        Settings(DATABASE_BACKEND="mock", CORS_ORIGINS="*")

    with pytest.raises(ValueError, match="Wildcard '\\*' is not permitted"):
        Settings(DATABASE_BACKEND="mock", CORS_ORIGINS='["*"]')

    with pytest.raises(ValueError, match="Wildcard '\\*' is not permitted"):
        Settings(DATABASE_BACKEND="mock", CORS_ORIGINS=["*"])

def test_settings_without_production_secrets():
    """Verify settings can be initialized without production secrets in local/test modes."""
    from api.config import Settings
    s = Settings(DATABASE_BACKEND="mock", GEMINI_API_KEY=None, MARKETAUX_API_KEY=None)
    assert s.DATABASE_BACKEND == "mock"
    assert s.GEMINI_API_KEY is None
    assert s.MARKETAUX_API_KEY is None

