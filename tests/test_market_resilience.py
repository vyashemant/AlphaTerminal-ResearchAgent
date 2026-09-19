import pytest
import asyncio
from unittest.mock import MagicMock, patch
from services.market_service import (
    _fetch_ticker_data,
    get_market_movers,
    run_screener,
    market_cache
)
from tools.market_data_tool import MarketDataTool

class MockFastInfo:
    last_price = 150.25
    previous_close = 148.00
    market_cap = 2500000000000.0
    year_high = 180.00
    year_low = 120.00
    last_volume = 45000000
    def get(self, k, default=None):
        return getattr(self, k, default)

def test_fetch_ticker_data_crumb_failure_resilience():
    """Verify that when t.info raises 401 Invalid Crumb, _fetch_ticker_data extracts fast_info safely."""
    with patch("yfinance.Ticker") as mock_ticker_cls:
        mock_instance = MagicMock()
        mock_instance.fast_info = MockFastInfo()
        # Simulate 401 Invalid Crumb on info
        type(mock_instance).info = property(lambda self: (_ for _ in ()).throw(RuntimeError("401 Client Error: Invalid Crumb")))
        mock_ticker_cls.return_value = mock_instance

        data = _fetch_ticker_data("AAPL")

    assert data is not None
    assert data["ticker"] == "AAPL"
    assert data["company"] == "Apple Inc." # Curated fallback name
    assert data["price"] == 150.25
    assert data["day_change_pct"] > 0
    assert data["market_cap"] == 2500000000000.0
    assert data["fifty_two_week_high"] == 180.00
    # Unavailable fundamentals must be None, never fabricated or zeroed
    assert data["pe"] is None
    assert data["dividend_yield"] is None
    assert data["fundamentals_available"] is False

def test_get_market_movers_degraded_when_empty():
    """Verify market movers returns structured degraded response when universe data cannot be fetched."""
    market_cache.clear()
    with patch("services.market_service.fetch_universe_data", return_value=[]):
        result = asyncio.run(get_market_movers())

    assert result["status"] == "degraded"
    assert result["gainers"] == []
    assert result["losers"] == []
    assert "temporarily unavailable" in result["message"]

def test_get_market_movers_success():
    """Verify market movers correctly identifies gainers and losers from price changes."""
    mock_universe = [
        {"ticker": "WIN", "company": "Winner Co", "price": 100.0, "day_change_pct": 5.5},
        {"ticker": "FLAT", "company": "Flat Co", "price": 50.0, "day_change_pct": 0.0},
        {"ticker": "LOSE", "company": "Loser Co", "price": 20.0, "day_change_pct": -3.2},
    ]
    with patch("services.market_service.fetch_universe_data", return_value=mock_universe):
        result = asyncio.run(get_market_movers())

    assert result["status"] == "ok"
    assert len(result["gainers"]) == 1
    assert result["gainers"][0]["ticker"] == "WIN"
    assert len(result["losers"]) == 1
    assert result["losers"][0]["ticker"] == "LOSE"

def test_run_screener_handles_unavailable_metrics():
    """Verify screener excludes items where requested fundamental metric is unavailable (None)."""
    mock_data = [
        {"ticker": "AAPL", "price": 150.0, "market_cap": 2e12, "pe": 25.0, "dividend_yield": 0.01},
        {"ticker": "CRUMB_FAIL", "price": 200.0, "market_cap": 1e12, "pe": None, "dividend_yield": None},
    ]
    with patch("services.market_service.fetch_universe_data", return_value=mock_data):
        # Filtering by min_pe=10 should only return AAPL, not CRUMB_FAIL
        results = asyncio.run(run_screener(min_pe=10.0))
        assert len(results) == 1
        assert results[0]["ticker"] == "AAPL"

        # Filtering by price alone should include both
        all_results = asyncio.run(run_screener(min_price=100.0))
        assert len(all_results) == 2

def test_market_data_tool_fetch_data_resilience():
    """Verify MarketDataTool.fetch_data succeeds on crumb error via fast_info."""
    tool = MarketDataTool()
    with patch("yfinance.Ticker") as mock_ticker_cls:
        mock_instance = MagicMock()
        mock_instance.fast_info = MockFastInfo()
        type(mock_instance).info = property(lambda self: (_ for _ in ()).throw(RuntimeError("401 Client Error: Invalid Crumb")))
        mock_instance.history.return_value = None
        mock_ticker_cls.return_value = mock_instance

        res = tool.fetch_data("MSFT")

    assert "error" not in res
    assert res["ticker"] == "MSFT"
    assert res["company"] == "Microsoft Corporation"
    assert res["market_data"]["current_price"] == 150.25
    assert res["market_data"]["market_cap"] == 2500000000000.0

def test_market_data_tool_missing_price_returns_explicit_error():
    """Verify MarketDataTool returns explicit degraded/unavailable error when price cannot be retrieved."""
    tool = MarketDataTool()
    with patch("yfinance.Ticker") as mock_ticker_cls:
        mock_instance = MagicMock()
        mock_instance.fast_info = None
        mock_instance.history.return_value = None
        mock_instance.info = {}
        mock_ticker_cls.return_value = mock_instance

        res = tool.fetch_data("UNKNOWN")

    assert "error" in res
    assert "Unable to retrieve market price" in res["error"]
    assert "unavailable" in res["error"].lower()

def test_fetch_universe_data_concurrency_bounded():
    """Verify that fetch_universe_data bounds concurrent ticker fetches to MARKET_UNIVERSE_CONCURRENCY (5)."""
    from services.market_service import fetch_universe_data, MARKET_UNIVERSE_CONCURRENCY, market_cache
    market_cache.clear()

    active_tasks = 0
    max_active = 0
    lock = asyncio.Lock()

    async def mock_fetch_ticker(ticker: str):
        nonlocal active_tasks, max_active
        async with lock:
            active_tasks += 1
            if active_tasks > max_active:
                max_active = active_tasks
        
        # Artificial async delay to allow concurrency buildup
        await asyncio.sleep(0.02)

        async with lock:
            active_tasks -= 1

        return {
            "ticker": ticker,
            "company": f"{ticker} Inc",
            "price": 100.0,
            "day_change_pct": 0.5
        }

    with patch("services.market_service.fetch_ticker_data_async", side_effect=mock_fetch_ticker):
        results = asyncio.run(fetch_universe_data())

    assert len(results) > 0
    assert max_active <= MARKET_UNIVERSE_CONCURRENCY
    assert max_active == 5
