from fastapi import FastAPI, HTTPException, BackgroundTasks, status, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict
import logging
from contextlib import asynccontextmanager
import uuid
from datetime import datetime, timezone

from agents.investment_research_report import InvestmentResearchReport
from services.research_service import submit_research_job, get_job_history, get_research_job
from api.auth import get_current_user

# Setup minimal logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    import db.database as db
    db.init_db()
    import asyncio
    from services.research_service import find_stale_running_jobs
    # Run recovery without blocking startup
    asyncio.create_task(asyncio.to_thread(find_stale_running_jobs))
    yield

app = FastAPI(
    title="AI Investment Research API",
    description="API backend for the AI Investment Research Engine.",
    version="1.0.0",
    lifespan=lifespan
)

# Basic CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    company: str
    ticker: str

    @field_validator("company")
    @classmethod
    def validate_company(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Company cannot be empty.")
        return v.strip()

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Ticker cannot be empty.")
        return v.strip().upper()

class ResearchJobResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[InvestmentResearchReport] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class ResearchHistoryItem(BaseModel):
    job_id: str
    company: str
    ticker: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class ResearchHistoryResponse(BaseModel):
    research: List[ResearchHistoryItem]

class WatchlistItemRequest(BaseModel):
    ticker: str
    company_name: Optional[str] = None

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Ticker cannot be empty.")
        return v.strip().upper()

class WatchlistItemResponse(BaseModel):
    id: str
    ticker: str
    company_name: Optional[str] = None
    created_at: str

class WatchlistResponse(BaseModel):
    watchlist: List[WatchlistItemResponse]

class PortfolioItemRequest(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    quantity: float
    average_cost: float

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Ticker cannot be empty.")
        return v.strip().upper()

class PortfolioItemUpdate(BaseModel):
    quantity: float
    average_cost: float

class PortfolioItemResponse(BaseModel):
    id: str
    ticker: str
    company_name: Optional[str] = None
    quantity: float
    average_cost: float
    created_at: str
    updated_at: str

class PortfolioResponse(BaseModel):
    portfolio: List[PortfolioItemResponse]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/v1/research", status_code=status.HTTP_202_ACCEPTED, response_model=ResearchJobResponse)
def research(request: ResearchRequest, background_tasks: BackgroundTasks, user: Dict[str, str] = Depends(get_current_user)):
    job_id, created_at = submit_research_job(
        company=request.company, 
        ticker=request.ticker, 
        background_tasks=background_tasks,
        user_id=user["id"]
    )
    
    return ResearchJobResponse(
        job_id=job_id,
        status="queued",
        created_at=created_at
    )

@app.get("/api/v1/research/history", response_model=ResearchHistoryResponse)
def get_research_history_route(limit: int = Query(20, ge=1, le=100), user: Dict[str, str] = Depends(get_current_user)):
    jobs = get_job_history(limit=limit, user_id=user["id"])
    history_items = []
    for job in jobs:
        history_items.append(ResearchHistoryItem(
            job_id=job["job_id"],
            company=job["company"],
            ticker=job["ticker"],
            status=job["status"],
            created_at=job["created_at"],
            started_at=job.get("started_at"),
            completed_at=job.get("completed_at")
        ))
    
    return ResearchHistoryResponse(research=history_items)

@app.get("/api/v1/research/{job_id}", response_model=ResearchJobResponse)
def get_research_status_route(job_id: str, user: Dict[str, str] = Depends(get_current_user)):
    job_data = get_research_job(job_id, user_id=user["id"])
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research job not found."
        )
        
    return ResearchJobResponse(
        job_id=job_data["job_id"],
        status=job_data["status"],
        result=job_data.get("result"),
        error=job_data.get("error"),
        created_at=job_data["created_at"],
        started_at=job_data.get("started_at"),
        completed_at=job_data.get("completed_at")
    )

@app.get("/api/v1/watchlist", response_model=WatchlistResponse)
def get_watchlist_route(user: Dict[str, str] = Depends(get_current_user)):
    try:
        import db.database as db
        items = db.list_watchlist(user_id=user["id"])
        watchlist_items = []
        for item in items:
            watchlist_items.append(WatchlistItemResponse(
                id=item["id"],
                ticker=item["ticker"],
                company_name=item.get("company_name"),
                created_at=item["created_at"]
            ))
        return WatchlistResponse(watchlist=watchlist_items)
    except Exception as e:
        logger.error(f"Failed to get watchlist: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/api/v1/watchlist", status_code=status.HTTP_201_CREATED, response_model=WatchlistItemResponse)
def add_watchlist_item_route(request: WatchlistItemRequest, user: Dict[str, str] = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        import db.database as db
        db.add_watchlist_item(
            id=item_id,
            user_id=user["id"],
            ticker=request.ticker,
            company_name=request.company_name,
            created_at=created_at
        )
        return WatchlistItemResponse(
            id=item_id,
            ticker=request.ticker,
            company_name=request.company_name,
            created_at=created_at
        )
    except db.ItemExistsError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ticker already in watchlist")
    except Exception as e:
        logger.error(f"Failed to add to watchlist: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/api/v1/watchlist/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist_item_route(item_id: str, user: Dict[str, str] = Depends(get_current_user)):
    try:
        import db.database as db
        db.delete_watchlist_item(id=item_id, user_id=user["id"])
        return None
    except Exception as e:
        logger.error(f"Failed to delete watchlist item: {e}")
        raise HTTPException(status_code=500, detail="Database error")

# --- PORTFOLIO ENDPOINTS ---

@app.get("/api/v1/portfolio", response_model=PortfolioResponse)
def get_portfolio_route(user: Dict[str, str] = Depends(get_current_user)):
    try:
        import db.database as db
        items = db.list_portfolio(user_id=user["id"])
        portfolio_items = []
        for item in items:
            portfolio_items.append(PortfolioItemResponse(**item))
        return PortfolioResponse(portfolio=portfolio_items)
    except Exception as e:
        logger.error(f"Failed to get portfolio: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/api/v1/portfolio", status_code=status.HTTP_201_CREATED, response_model=PortfolioItemResponse)
def add_portfolio_item_route(request: PortfolioItemRequest, user: Dict[str, str] = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    try:
        import db.database as db
        db.add_portfolio_item(
            id=item_id,
            user_id=user["id"],
            ticker=request.ticker,
            company_name=request.company_name,
            quantity=request.quantity,
            average_cost=request.average_cost,
            created_at=now,
            updated_at=now
        )
        return PortfolioItemResponse(
            id=item_id,
            ticker=request.ticker,
            company_name=request.company_name,
            quantity=request.quantity,
            average_cost=request.average_cost,
            created_at=now,
            updated_at=now
        )
    except db.ItemExistsError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ticker already in portfolio")
    except Exception as e:
        logger.error(f"Failed to add to portfolio: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.patch("/api/v1/portfolio/{item_id}", response_model=PortfolioItemResponse)
def update_portfolio_item_route(item_id: str, request: PortfolioItemUpdate, user: Dict[str, str] = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    try:
        import db.database as db
        db.update_portfolio_item(
            id=item_id,
            user_id=user["id"],
            quantity=request.quantity,
            average_cost=request.average_cost,
            updated_at=now
        )
        items = db.list_portfolio(user_id=user["id"])
        for item in items:
            if item["id"] == item_id:
                return PortfolioItemResponse(**item)
        raise HTTPException(status_code=404, detail="Item not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update portfolio item: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/api/v1/portfolio/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item_route(item_id: str, user: Dict[str, str] = Depends(get_current_user)):
    try:
        import db.database as db
        db.delete_portfolio_item(id=item_id, user_id=user["id"])
        return None
    except Exception as e:
        logger.error(f"Failed to delete portfolio item: {e}")
        raise HTTPException(status_code=500, detail="Database error")

# --- MARKETS ENDPOINTS ---

from tools.market_data_tool import MarketDataTool
from services.market_service import get_market_movers, run_screener

@app.get("/api/v1/markets/quote")
def get_market_quote(ticker: str):
    if not ticker or not ticker.strip():
        raise HTTPException(status_code=400, detail="Ticker is required")
    tool = MarketDataTool()
    result = tool.fetch_data(ticker)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/v1/markets/movers")
async def get_movers_route():
    try:
        return await get_market_movers()
    except Exception as e:
        logger.error(f"Failed to get market movers: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve market movers")

@app.get("/api/v1/markets/screener")
async def screener_route(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_yield: Optional[float] = None,
    max_yield: Optional[float] = None
):
    try:
        return await run_screener(
            min_price=min_price, max_price=max_price,
            min_market_cap=min_market_cap, max_market_cap=max_market_cap,
            min_pe=min_pe, max_pe=max_pe,
            min_yield=min_yield, max_yield=max_yield
        )
    except Exception as e:
        logger.error(f"Failed to run screener: {e}")
        raise HTTPException(status_code=500, detail="Failed to run screener")
