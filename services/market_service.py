import asyncio
import yfinance as yf
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

# Bounded stock universe for market movers and basic screener
MAJOR_TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "UNH",
    "V", "JNJ", "WMT", "MA", "PG", "XOM", "HD", "CVX", "LLY", "ABBV",
    "MRK", "KO", "PEP", "AVGO", "COST", "MCD", "TMO", "CRM", "PFE", "CSCO"
]

# Curated fallback mapping for major tickers when crumb-gated info fails
MAJOR_TICKER_NAMES = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com, Inc.",
    "NVDA": "NVIDIA Corporation",
    "META": "Meta Platforms, Inc.",
    "TSLA": "Tesla, Inc.",
    "BRK-B": "Berkshire Hathaway Inc.",
    "JPM": "JPMorgan Chase & Co.",
    "UNH": "UnitedHealth Group Inc.",
    "V": "Visa Inc.",
    "JNJ": "Johnson & Johnson",
    "WMT": "Walmart Inc.",
    "MA": "Mastercard Inc.",
    "PG": "Procter & Gamble Co.",
    "XOM": "Exxon Mobil Corp.",
    "HD": "Home Depot Inc.",
    "CVX": "Chevron Corporation",
    "LLY": "Eli Lilly and Company",
    "ABBV": "AbbVie Inc.",
    "MRK": "Merck & Co., Inc.",
    "KO": "Coca-Cola Company",
    "PEP": "PepsiCo, Inc.",
    "AVGO": "Broadcom Inc.",
    "COST": "Costco Wholesale Corp.",
    "MCD": "McDonald's Corporation",
    "TMO": "Thermo Fisher Scientific Inc.",
    "CRM": "Salesforce, Inc.",
    "PFE": "Pfizer Inc.",
    "CSCO": "Cisco Systems, Inc."
}

# Cache to avoid hammering yfinance
market_cache = TTLCache(maxsize=10, ttl=300) # 5 minutes TTL

async def fetch_ticker_data_async(ticker: str):
    return await asyncio.to_thread(_fetch_ticker_data, ticker)

def _safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        return f if (f == f) else None # check not NaN
    except (ValueError, TypeError):
        return None

def _fetch_ticker_data(ticker: str):
    """
    Fetch market data separating crumb-free fast_info / chart history
    from crumb-gated quote summary fundamentals.
    """
    try:
        t = yf.Ticker(ticker)
        fast_info = getattr(t, "fast_info", None)

        last_price = None
        prev_close = None
        market_cap = None
        high_52w = None
        low_52w = None
        volume = None

        if fast_info is not None:
            last_price = _safe_float(getattr(fast_info, "last_price", None) or fast_info.get("lastPrice"))
            prev_close = _safe_float(getattr(fast_info, "previous_close", None) or fast_info.get("previousClose"))
            market_cap = _safe_float(getattr(fast_info, "market_cap", None) or fast_info.get("marketCap"))
            high_52w = _safe_float(getattr(fast_info, "year_high", None) or fast_info.get("yearHigh"))
            low_52w = _safe_float(getattr(fast_info, "year_low", None) or fast_info.get("yearLow"))
            volume = _safe_float(getattr(fast_info, "last_volume", None) or fast_info.get("lastVolume"))

        # Fallback to history if price or previous close is still missing
        if last_price is None or prev_close is None:
            try:
                hist = t.history(period="5d")
                if hist is not None and not hist.empty:
                    if last_price is None and len(hist) > 0:
                        last_price = _safe_float(hist["Close"].iloc[-1])
                    if prev_close is None and len(hist) > 1:
                        prev_close = _safe_float(hist["Close"].iloc[-2])
            except Exception:
                pass

        # Calculate day change %
        day_change_pct = 0.0
        if last_price is not None and prev_close is not None and prev_close > 0:
            day_change_pct = ((last_price - prev_close) / prev_close) * 100

        # Isolated attempt for crumb-gated fundamental quote info
        info = {}
        fundamentals_available = False
        try:
            raw_info = t.info
            if isinstance(raw_info, dict) and len(raw_info) > 0:
                info = raw_info
                fundamentals_available = True
        except Exception as e:
            logger.debug(f"Crumb-gated info unavailable for {ticker}: {e}")

        # If fast_info missed price, try info
        if last_price is None:
            last_price = _safe_float(info.get("currentPrice") or info.get("regularMarketPrice"))
        if prev_close is None:
            prev_close = _safe_float(info.get("previousClose"))
            if last_price is not None and prev_close is not None and prev_close > 0:
                day_change_pct = ((last_price - prev_close) / prev_close) * 100

        # If we still have no price, ticker data could not be retrieved
        if last_price is None:
            logger.warning(f"Could not retrieve price for {ticker}")
            return None

        company_name = info.get("shortName") or info.get("longName") or MAJOR_TICKER_NAMES.get(ticker, ticker)

        # Fundamental metrics: explicit None when unavailable (never fake or zeroed out)
        pe = _safe_float(info.get("trailingPE"))
        forward_pe = _safe_float(info.get("forwardPE"))
        ps = _safe_float(info.get("priceToSalesTrailing12Months"))
        pb = _safe_float(info.get("priceToBook"))
        beta = _safe_float(info.get("beta"))
        dividend_yield = _safe_float(info.get("dividendYield"))
        # Yahoo dividendYield is sometimes expressed as a decimal (e.g. 0.005 for 0.5%)
        # Keep raw or None if unavailable

        return {
            "ticker": ticker,
            "company": company_name,
            "price": round(last_price, 2) if last_price is not None else None,
            "day_change_pct": round(day_change_pct, 2) if day_change_pct is not None else 0.0,
            "market_cap": market_cap or _safe_float(info.get("marketCap")),
            "pe": round(pe, 2) if pe is not None else None,
            "forward_pe": round(forward_pe, 2) if forward_pe is not None else None,
            "ps": round(ps, 2) if ps is not None else None,
            "pb": round(pb, 2) if pb is not None else None,
            "beta": round(beta, 2) if beta is not None else None,
            "dividend_yield": dividend_yield,
            "fifty_two_week_high": high_52w or _safe_float(info.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": low_52w or _safe_float(info.get("fiftyTwoWeekLow")),
            "fundamentals_available": fundamentals_available
        }
    except Exception as e:
        logger.warning(f"Failed to fetch data for {ticker}: {e}")
        return None

# Bounded concurrency limit for universe ticker retrieval (Yahoo Finance resilience)
MARKET_UNIVERSE_CONCURRENCY = 5

async def fetch_universe_data():
    cache_key = "universe_data"
    if cache_key in market_cache:
        return market_cache[cache_key]

    # Bounded concurrency
    semaphore = asyncio.Semaphore(MARKET_UNIVERSE_CONCURRENCY)
    
    async def fetch_with_sema(t):
        async with semaphore:
            return await fetch_ticker_data_async(t)
    
    tasks = [fetch_with_sema(t) for t in MAJOR_TICKERS]
    results = await asyncio.gather(*tasks)
    
    valid_results = [r for r in results if r is not None and r.get("price") is not None]
    
    if valid_results:
        market_cache[cache_key] = valid_results
    return valid_results

async def get_market_movers():
    data = await fetch_universe_data()
    if not data:
        return {
            "gainers": [],
            "losers": [],
            "status": "degraded",
            "message": "Market data temporarily unavailable from upstream provider"
        }
        
    sorted_data = sorted(data, key=lambda x: x.get("day_change_pct", 0), reverse=True)
    
    gainers = [x for x in sorted_data if x.get("day_change_pct", 0) > 0][:5]
    losers = sorted([x for x in data if x.get("day_change_pct", 0) < 0], 
                   key=lambda x: x.get("day_change_pct", 0))[:5]
                   
    return {
        "gainers": gainers,
        "losers": losers,
        "status": "ok"
    }

async def run_screener(
    min_price=None, max_price=None,
    min_market_cap=None, max_market_cap=None,
    min_pe=None, max_pe=None,
    min_yield=None, max_yield=None
):
    data = await fetch_universe_data()
    
    filtered = []
    for item in data:
        price = item.get("price")
        mcap = item.get("market_cap")
        pe = item.get("pe")
        div_yield = item.get("dividend_yield")

        # Filters: strictly exclude if metric is specified but missing/outside bounds
        if min_price is not None and (price is None or price < min_price): continue
        if max_price is not None and (price is None or price > max_price): continue
        if min_market_cap is not None and (mcap is None or mcap < min_market_cap): continue
        if max_market_cap is not None and (mcap is None or mcap > max_market_cap): continue
        if min_pe is not None and (pe is None or pe < min_pe): continue
        if max_pe is not None and (pe is None or pe > max_pe): continue
        if min_yield is not None and (div_yield is None or div_yield < min_yield): continue
        if max_yield is not None and (div_yield is None or div_yield > max_yield): continue
        
        filtered.append(item)
        
    return filtered

