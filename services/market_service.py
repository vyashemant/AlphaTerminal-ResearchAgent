import asyncio
import yfinance as yf
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

# Bounded stock universe for market movers and basic screener
# In a real app this would be a full DB of active tickers.
MAJOR_TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "UNH",
    "V", "JNJ", "WMT", "MA", "PG", "XOM", "HD", "CVX", "LLY", "ABBV",
    "MRK", "KO", "PEP", "AVGO", "COST", "MCD", "TMO", "CRM", "PFE", "CSCO"
]

# Cache to avoid hammering yfinance
market_cache = TTLCache(maxsize=10, ttl=300) # 5 minutes TTL

async def fetch_ticker_data_async(ticker: str):
    return await asyncio.to_thread(_fetch_ticker_data, ticker)

def _fetch_ticker_data(ticker: str):
    try:
        t = yf.Ticker(ticker)
        fast_info = t.fast_info
        info = t.info
        
        last_price = fast_info.get("lastPrice")
        prev_close = info.get("previousClose")
        
        day_change_pct = 0.0
        if last_price and prev_close and prev_close > 0:
            day_change_pct = ((last_price - prev_close) / prev_close) * 100

        return {
            "ticker": ticker,
            "company": info.get("shortName") or info.get("longName") or ticker,
            "price": last_price,
            "day_change_pct": day_change_pct,
            "market_cap": info.get("marketCap"),
            "pe": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "ps": info.get("priceToSalesTrailing12Months"),
            "pb": info.get("priceToBook"),
            "beta": info.get("beta"),
            "dividend_yield": info.get("dividendYield", 0) * 100 if info.get("dividendYield") else 0,
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow")
        }
    except Exception as e:
        logger.warning(f"Failed to fetch data for {ticker}: {e}")
        return None

async def fetch_universe_data():
    cache_key = "universe_data"
    if cache_key in market_cache:
        return market_cache[cache_key]

    # Bounded concurrency
    semaphore = asyncio.Semaphore(10)
    
    async def fetch_with_sema(t):
        async with semaphore:
            return await fetch_ticker_data_async(t)
    
    tasks = [fetch_with_sema(t) for t in MAJOR_TICKERS]
    results = await asyncio.gather(*tasks)
    
    valid_results = [r for r in results if r is not None and r.get("price")]
    
    market_cache[cache_key] = valid_results
    return valid_results

async def get_market_movers():
    data = await fetch_universe_data()
    if not data:
        return {"gainers": [], "losers": []}
        
    sorted_data = sorted(data, key=lambda x: x.get("day_change_pct", 0), reverse=True)
    
    gainers = [x for x in sorted_data if x.get("day_change_pct", 0) > 0][:5]
    
    losers = sorted([x for x in data if x.get("day_change_pct", 0) < 0], 
                   key=lambda x: x.get("day_change_pct", 0))[:5]
                   
    return {
        "gainers": gainers,
        "losers": losers
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
        mcap = item.get("marketCap")
        pe = item.get("pe")
        div_yield = item.get("dividend_yield")

        # Filters
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
