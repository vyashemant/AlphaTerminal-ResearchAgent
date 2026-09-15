import pytest
import sys, os
from api.config import settings
settings.DATABASE_BACKEND = "mock"
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
    import api.main
    async def mock_movers():
        return {"gainers": [{"ticker": "AAPL", "price": 150, "day_change_pct": 2.5}], "losers": []}
    monkeypatch.setattr(api.main, "get_market_movers", mock_movers)
    
    response = client.get("/api/v1/markets/movers")
    assert response.status_code == 200
    data = response.json()
    assert "gainers" in data
    assert len(data["gainers"]) == 1
    assert data["gainers"][0]["ticker"] == "AAPL"

def test_add_invalid_portfolio_item():
    # Negative quantity
    response = client.post("/api/v1/portfolio", json={
        "ticker": "AAPL",
        "quantity": -5,
        "average_cost": 150.25
    })
    assert response.status_code == 422

    # Negative average cost
    response = client.post("/api/v1/portfolio", json={
        "ticker": "AAPL",
        "quantity": 10,
        "average_cost": -10
    })
    assert response.status_code == 422

def test_screener_invalid_bounds():
    response = client.get("/api/v1/markets/screener?min_pe=20&max_pe=10")
    assert response.status_code == 422

    response = client.get("/api/v1/markets/screener?min_market_cap=nan")
    assert response.status_code == 422

def test_screener_market_cap_filtering(monkeypatch):
    import services.market_service
    async def mock_universe():
        return [
            {"ticker": "SMALL", "price": 10, "market_cap": 1_000_000},
            {"ticker": "MID", "price": 50, "market_cap": 5_000_000_000},
            {"ticker": "MEGA", "price": 150, "market_cap": 2_000_000_000_000}
        ]
    monkeypatch.setattr(services.market_service, "fetch_universe_data", mock_universe)
    
    # Filter min_market_cap
    res1 = client.get("/api/v1/markets/screener?min_market_cap=2000000")
    assert res1.status_code == 200
    tickers1 = [t["ticker"] for t in res1.json()]
    assert "SMALL" not in tickers1
    assert "MID" in tickers1
    assert "MEGA" in tickers1

    # Filter max_market_cap
    res2 = client.get("/api/v1/markets/screener?max_market_cap=1000000000000")
    assert res2.status_code == 200
    tickers2 = [t["ticker"] for t in res2.json()]
    assert "SMALL" in tickers2
    assert "MID" in tickers2
    assert "MEGA" not in tickers2

def test_portfolio_user_isolation(monkeypatch):
    from api.main import get_current_user
    
    # Add item for user 1
    app.dependency_overrides[get_current_user] = lambda: {"id": "user1", "email": "u1@example.com"}
    res1 = client.post("/api/v1/portfolio", json={"ticker": "MSFT", "quantity": 1, "average_cost": 1})
    assert res1.status_code == 201

    # Check user 1 sees it
    res_get1 = client.get("/api/v1/portfolio")
    assert len(res_get1.json()["portfolio"]) >= 1
    
    # User 2 should not see it
    app.dependency_overrides[get_current_user] = lambda: {"id": "user2", "email": "u2@example.com"}
    res_get2 = client.get("/api/v1/portfolio")
    assert not any(i["ticker"] == "MSFT" for i in res_get2.json()["portfolio"])
    
    app.dependency_overrides.clear()

def test_dividend_yield_scaling(monkeypatch):
    import services.market_service
    async def mock_universe():
        return [{"ticker": "AAPL", "price": 150, "dividend_yield": 0.32}]
    monkeypatch.setattr(services.market_service, "fetch_universe_data", mock_universe)
    
    res = client.get("/api/v1/markets/screener")
    assert res.status_code == 200
    data = res.json()
    assert data[0]["dividend_yield"] == 0.32
