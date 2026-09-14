import pytest
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_auth(monkeypatch):
    from api.main import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"id": "11111111-2222-3333-4444-555555555555", "email": "test@example.com"}
    yield
    app.dependency_overrides.clear()

def test_add_portfolio_item():
    response = client.post("/api/v1/portfolio", json={
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "quantity": 10.5,
        "average_cost": 150.25
    })
    assert response.status_code == 201
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert data["quantity"] == 10.5
    assert data["average_cost"] == 150.25
    assert "id" in data

def test_get_portfolio():
    response = client.get("/api/v1/portfolio")
    assert response.status_code == 200
    data = response.json()
    assert "portfolio" in data
    assert len(data["portfolio"]) >= 1

def test_get_market_movers(monkeypatch):
    import services.market_service
    async def mock_movers():
        return {"gainers": [{"ticker": "AAPL", "price": 150, "day_change_pct": 2.5}], "losers": []}
    monkeypatch.setattr(services.market_service, "get_market_movers", mock_movers)
    
    response = client.get("/api/v1/markets/movers")
    assert response.status_code == 200
    data = response.json()
    assert "gainers" in data
    assert len(data["gainers"]) == 1
    assert data["gainers"][0]["ticker"] == "AAPL"
