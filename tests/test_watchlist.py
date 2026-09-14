import pytest
from fastapi.testclient import TestClient
import uuid
from typing import Generator
import os

# Ensure testing mode before importing app
os.environ["DATABASE_BACKEND"] = "mock"

from api.main import app
import db.database as db

@pytest.fixture(autouse=True)
def setup_db() -> Generator:
    """Ensure mock DB is used and clean before each test"""
    db.set_testing_mode(True)
    db.clear_mock_db()
    db.init_db()
    yield
    db.clear_mock_db()

@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

@pytest.fixture
def token_a() -> str:
    return "test-token-valid"

@pytest.fixture
def token_b() -> str:
    return "test-token-valid-user-b"

def test_watchlist_unauthenticated(client: TestClient):
    response = client.get("/api/v1/watchlist")
    assert response.status_code == 401

def test_add_watchlist_item(client: TestClient, token_a: str):
    headers = {"Authorization": f"Bearer {token_a}"}
    response = client.post(
        "/api/v1/watchlist",
        json={"ticker": "aapl", "company_name": "Apple Inc."},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ticker"] == "AAPL" # should be normalized
    assert data["company_name"] == "Apple Inc."
    assert "id" in data
    assert "created_at" in data

def test_duplicate_prevention(client: TestClient, token_a: str):
    headers = {"Authorization": f"Bearer {token_a}"}
    # First addition
    client.post("/api/v1/watchlist", json={"ticker": "AAPL"}, headers=headers)
    
    # Second addition should conflict
    response = client.post("/api/v1/watchlist", json={"ticker": "AAPL"}, headers=headers)
    assert response.status_code == 409

def test_user_isolation(client: TestClient, token_a: str, token_b: str):
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # User A adds AAPL
    client.post("/api/v1/watchlist", json={"ticker": "AAPL"}, headers=headers_a)
    
    # User B adds TSLA
    resp_b = client.post("/api/v1/watchlist", json={"ticker": "TSLA"}, headers=headers_b)
    item_id_b = resp_b.json()["id"]
    
    # User A should only see AAPL
    resp_a_list = client.get("/api/v1/watchlist", headers=headers_a)
    assert len(resp_a_list.json()["watchlist"]) == 1
    assert resp_a_list.json()["watchlist"][0]["ticker"] == "AAPL"
    
    # User B should only see TSLA
    resp_b_list = client.get("/api/v1/watchlist", headers=headers_b)
    assert len(resp_b_list.json()["watchlist"]) == 1
    assert resp_b_list.json()["watchlist"][0]["ticker"] == "TSLA"
    
    # User A cannot delete User B's item
    resp_delete_fail = client.delete(f"/api/v1/watchlist/{item_id_b}", headers=headers_a)
    # The endpoint returns 204 even if the item wasn't deleted (no error thrown)
    # But let's verify it wasn't actually deleted
    resp_b_check = client.get("/api/v1/watchlist", headers=headers_b)
    assert len(resp_b_check.json()["watchlist"]) == 1

def test_delete_own_item(client: TestClient, token_a: str):
    headers = {"Authorization": f"Bearer {token_a}"}
    resp = client.post("/api/v1/watchlist", json={"ticker": "AAPL"}, headers=headers)
    item_id = resp.json()["id"]
    
    del_resp = client.delete(f"/api/v1/watchlist/{item_id}", headers=headers)
    assert del_resp.status_code == 204
    
    list_resp = client.get("/api/v1/watchlist", headers=headers)
    assert len(list_resp.json()["watchlist"]) == 0
