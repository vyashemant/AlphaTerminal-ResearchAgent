# Alpha Terminal

**Alpha Terminal** is a personal engineering and portfolio project by Hemant Vyas demonstrating a production-oriented AI-powered financial research platform. It combines deterministic financial data retrieval with advanced AI analysis (via Gemini/CrewAI) to deliver evidence-backed AI investment research and market insights, screeners, paper trading portfolios, and personalized watchlists.

---

## 1. Project Title
Alpha Terminal — AI Investment Research Platform

## 2. Short Project Description
Alpha Terminal provides sophisticated market intelligence by executing deep fundamental analysis. It retrieves real-time financial data, validates metrics deterministically, and synthesizes reports using a multi-agent AI system. It features a modern, dual-themed (Light/Dark), fintech-inspired React dashboard backed by a high-performance FastAPI server and Supabase for authentication and persistence.

## 3. Key Features
- **AI-Powered Research**: Multi-agent system that analyzes SEC filings, earnings transcripts, and news to generate comprehensive investment strategies.
- **Deterministic Metrics**: Accurate financial math (P/E, yield, margins) calculated purely in Python, ensuring the AI relies on factual data.
- **Paper Portfolio**: Track holdings, view allocation visualizations (PieCharts), calculate weights, and monitor unrealized P/L based on real-time prices.
- **Screener & Markets**: Filter bounded asset universes by market cap, P/E, dividend yield, and price. View daily market movers (gainers/losers).
- **Watchlist Integration**: Seamlessly save researched tickers to a persistent watchlist.
- **Robust Job Lifecycle**: Asynchronous research execution with stale-job recovery and background task processing.
- **User Isolation**: Secure Supabase integration with Row Level Security (RLS), ensuring isolated user data.

## 4. Architecture / System Flow
The platform operates a clear separation of concerns between raw data processing and AI synthesis:

1. **Retrieval**: Gather data from Yahoo Finance (yfinance), EDGAR, and news APIs.
2. **Validation**: Ensure data integrity and completeness.
3. **Calculation**: Compute financial metrics deterministically.
4. **AI Specialist Analysis**: CrewAI agents analyze the validated data.
5. **Investment Strategy**: Synthesize analyses into a cohesive strategy.
6. **Evidence / Provenance**: Track sources for AI claims.
7. **Consistency / Evaluation**: Final pass to ensure logical consistency.
8. **Persistence**: Store results in Supabase.
9. **Presentation**: Render the report in the React frontend.

## 5. Tech Stack
- **Frontend**: React 19, Vite, TypeScript, React Router, Recharts, Lucide Icons, vanilla CSS (Light/Dark theme).
- **Backend**: FastAPI, Python 3.10+, Pydantic, yfinance, TTLCache (cachetools).
- **AI / Agents**: CrewAI, Google Gemini (`gemini-3.5-flash`).
- **Database / Auth**: Supabase (PostgreSQL), SQLite (fallback/mock).

## 6. Application Structure
```
CrewAI-AiAgent/
├── api/             # FastAPI endpoints and route handlers
├── agents/          # CrewAI agent definitions and prompts
├── db/              # Database abstraction (SQLite/Supabase/Mock)
├── frontend/        # React + Vite frontend dashboard
├── services/        # Business logic (Research, Markets, Screener)
├── supabase/        # Supabase migrations and configurations
├── tests/           # Pytest suite
└── tools/           # Data retrieval tools (Yahoo Finance, SEC, etc.)
```

## 7. AI Agent Architecture
Alpha Terminal uses a multi-agent system built on CrewAI:
- **Fundamental Analyst**: Evaluates financials and balance sheets.
- **News Analyst**: Analyzes sentiment and recent market developments.
- **Strategist**: Synthesizes the findings into actionable investment strategies.

## 8. Data Sources
- **Yahoo Finance (`yfinance`)**: Real-time quotes, market caps, P/E, historical prices.
- **SEC EDGAR**: Filings and institutional holdings.
- **Marketaux / News API**: Market sentiment and news events.

## 9. Deterministic Financial Calculations
To prevent AI hallucinations, all math is executed deterministically in Python. The system retrieves raw numbers and calculates valuation ratios, margins, and portfolio weights outside the LLM. The AI is only provided the final, factual figures to analyze.

## 10. Evidence / Provenance System
The platform records the source of major claims. The output includes a provenance section detailing which SEC filing, news article, or market data point contributed to specific strategic conclusions.

## 11. Research Job Lifecycle
- **Submission**: User submits a ticker. Returns `202 Accepted` with a `job_id`.
- **Background Execution**: FastAPI `BackgroundTasks` executes the pipeline.
- **Polling**: Frontend polls the status endpoint (`queued` -> `running` -> `completed` / `failed`).
- **Stale Job Recovery**: On backend startup, jobs stuck in `running` state are automatically swept and marked `failed` to prevent infinite loading.

## 12. Authentication and User Isolation
1. The frontend authenticates directly with Supabase via email/password.
2. Supabase issues a JWT access token.
3. The frontend passes the token as a `Bearer` header to FastAPI.
4. FastAPI verifies the Supabase access token and obtains the authenticated user's identity.
5. All database operations strictly use this derived `user_id`. The frontend NEVER submits `user_id` as a payload parameter, and the frontend NEVER possesses the Supabase `service-role` key.

## 13. Supabase Database Architecture
The backend uses a scalable PostgreSQL abstraction supporting Supabase.
**Migrations**:
- `20260908_create_research_jobs.sql`: Stores asynchronous reports.
- `20260911_add_started_at.sql`: Lifecycle tracking.
- `20260912_add_user_id.sql`: Enforces RLS and ownership.
- `20260913_create_watchlist.sql`: Watchlist persistence.
- `20260914_create_portfolio.sql`: Paper portfolio holdings.

## 14. Watchlist
Persistent, user-scoped storage for tracked tickers. Seamlessly integrates with the Research UI, allowing users to toggle tickers into their watchlist immediately after analyzing them.

## 15. Markets
Dedicated dashboard to view market health. Features real-time quotes, dynamic search, and a "Market Movers" section detailing daily top gainers and losers. Includes graceful degradation and retry handling for external API rate limits.

## 16. Screeners
Advanced filtering across a bounded ticker universe. Supports numeric bounding (min/max) for Price, Market Cap, P/E Ratio, and Dividend Yield. Features server-side validation against `NaN` and `Infinity` payloads.

## 17. Paper Portfolio
Users can construct a paper portfolio (simulated trades). Features include:
- Adding/Editing/Deleting holdings.
- Real-time market value and unrealized P/L calculation.
- Portfolio weight % per holding.
- Recharts-powered allocation donut chart.

## 18. API Overview
### Research
- `POST /api/v1/research` - Submit job
- `GET /api/v1/research/history` - List history
- `GET /api/v1/research/{job_id}` - Get job result

### Watchlist
- `GET /api/v1/watchlist`
- `POST /api/v1/watchlist`
- `DELETE /api/v1/watchlist/{item_id}`

### Portfolio
- `GET /api/v1/portfolio`
- `POST /api/v1/portfolio`
- `PATCH /api/v1/portfolio/{item_id}`
- `DELETE /api/v1/portfolio/{item_id}`

### Markets
- `GET /api/v1/markets/quote`
- `GET /api/v1/markets/movers`
- `GET /api/v1/markets/screener`

## 19. Local Development Setup
### Backend
```bash
python -m venv venv
# PowerShell (Windows)
.\venv\Scripts\Activate.ps1
# CMD (Windows)
venv\Scripts\activate

pip install -r requirements.txt
python -m uvicorn api.main:app --reload --port 8000
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 20. Environment Variables
Provide the following in the root `.env` and `frontend/.env`:

**Backend (`.env`)**:
```env
DATABASE_BACKEND=supabase  # or sqlite/mock
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-server-only-secret
GEMINI_API_KEY=your-gemini-key
SEC_USER_AGENT=YourAppName your-email@example.com
MARKETAUX_API_KEY=your-marketaux-key
RESEARCH_JOB_TIMEOUT_SECONDS=3600
CORS_ORIGINS=["http://localhost:5173"]
LOG_LEVEL=INFO
```

**Frontend (`frontend/.env`)**:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## 21. Supabase Setup and Migrations
Ensure you have the Supabase CLI installed, then apply the migrations to your remote database:
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

## 22. Running Backend
See [Local Development Setup](#19-local-development-setup).

## 23. Running Frontend
See [Local Development Setup](#19-local-development-setup).

## 24. Testing
The project uses `pytest` for backend assertions. Tests cover research flow, screener filtering, invalidation bounds, and user portfolio isolation.
```bash
# Run tests with a mocked DB to prevent requiring an active Supabase instance
pytest tests/
```

## 25. Docker & Deployment

Alpha Terminal includes Docker support for reproducible environments.

### Building and Starting
To start the entire stack using Docker Compose:
```bash
docker-compose up --build -d
```

### Endpoints
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:5173`
- **Backend Health Check**: `http://localhost:8000/health` (Liveness)
- **Backend Readiness Check**: `http://localhost:8000/ready` (Application/DB availability)

### Environment Variables
Environment variables must be provided in `.env` (backend) and `frontend/.env` (frontend).

**Required backend variables (`.env`)**:
- `DATABASE_BACKEND` (sqlite, mock, or supabase)
- `GEMINI_API_KEY`, `MARKETAUX_API_KEY`, `SEC_USER_AGENT`
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (if using Supabase)

**Required frontend variables (`frontend/.env`)**:
- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**SECURITY WARNING**: 
- `SUPABASE_SECRET_KEY` is a backend-only secret and must **NEVER** be exposed to the frontend.
- Variables prefixed with `VITE_` are baked into the frontend bundle; do NOT place secrets here.
- Never commit `.env` files to version control.

## 26. API Reference

Alpha Terminal exposes a RESTful API powered by FastAPI with Pydantic validation, structured error responses, and Supabase JWT authentication.

### Interactive API Documentation
When the backend is running, interactive API explorers are available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### Authentication Model
Protected endpoints require a valid Supabase Auth JWT access token passed via the HTTP `Authorization` header:
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```
> [!IMPORTANT]
> The backend verifies the Bearer token server-side via Supabase Auth and derives the user's `user_id` directly from the authenticated identity. Endpoints do **NOT** accept or trust client-supplied `user_id` values in request bodies or query parameters.

---

### Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` | No | Liveness probe (container orchestrator check) |
| `GET` | `/ready` | No | Readiness probe (verifies database persistence availability) |
| `POST` | `/api/v1/research` | **Yes** | Dispatches asynchronous multi-agent investment research job |
| `GET` | `/api/v1/research/history` | **Yes** | Retrieves paginated research history for the authenticated user |
| `GET` | `/api/v1/research/{job_id}` | **Yes** | Retrieves status and full result report for a specific research job |
| `GET` | `/api/v1/watchlist` | **Yes** | Lists all watchlist items for the authenticated user |
| `POST` | `/api/v1/watchlist` | **Yes** | Adds an equity ticker to the user's watchlist |
| `DELETE` | `/api/v1/watchlist/{item_id}` | **Yes** | Removes an item from the user's watchlist |
| `GET` | `/api/v1/portfolio` | **Yes** | Lists all portfolio holdings for the authenticated user |
| `POST` | `/api/v1/portfolio` | **Yes** | Adds an equity position to the user's portfolio |
| `PATCH` | `/api/v1/portfolio/{item_id}` | **Yes** | Updates quantity and average cost basis of an existing holding |
| `DELETE` | `/api/v1/portfolio/{item_id}` | **Yes** | Deletes a holding from the user's portfolio |
| `GET` | `/api/v1/markets/quote` | No | Fetches real-time price, metrics, and valuation multiples for a ticker |
| `GET` | `/api/v1/markets/movers` | No | Fetches top daily market gainers and losers from major equities |
| `GET` | `/api/v1/markets/screener` | No | Filters equities by price, market cap, P/E ratio, and dividend yield |
| `GET` | `/docs` | No | Interactive Swagger UI API documentation |
| `GET` | `/redoc` | No | ReDoc API documentation |
| `GET` | `/openapi.json` | No | Machine-readable OpenAPI 3.1 specification |

---

### Detailed Endpoint Specifications

#### 1. Infrastructure & Health

##### `GET /health`
Liveness probe to verify the application process is running.
- **Authentication**: None
- **Status**: `200 OK`
- **Response**:
  ```json
  { "status": "ok" }
  ```
- **Example**:
  ```bash
  curl -s http://localhost:8000/health
  ```

##### `GET /ready`
Readiness probe verifying that backend persistence (database) is initialized and responding.
- **Authentication**: None
- **Status**: `200 OK` when ready; `503 Service Unavailable` if database connectivity fails.
- **Response (`200 OK`)**:
  ```json
  { "status": "ok" }
  ```
- **Response (`503 Service Unavailable`)**:
  ```json
  { "detail": "Service unavailable" }
  ```
- **Example**:
  ```bash
  curl -s -i http://localhost:8000/ready
  ```

---

#### 2. Research Pipeline

##### `POST /api/v1/research`
Submits a ticker for full asynchronous multi-agent investment research. Dispatches background execution using FastAPI `BackgroundTasks`.
- **Authentication**: `Bearer <token>`
- **Status**: `202 Accepted`
- **Request Body**:
  ```json
  {
    "company": "Apple Inc.",
    "ticker": "AAPL"
  }
  ```
  - `company` *(string, required)*: Non-empty company name.
  - `ticker` *(string, required)*: Non-empty equity ticker symbol (automatically trimmed and converted to uppercase).
- **Response (`202 Accepted`)**:
  ```json
  {
    "job_id": "7b8f9e21-0a4e-4f2b-9c71-3f11e8a93e12",
    "status": "queued",
    "result": null,
    "error": null,
    "created_at": "2026-09-16T12:00:00.000000+00:00",
    "started_at": null,
    "completed_at": null
  }
  ```
- **Job Lifecycle**:
  ```
  [ queued ] ──> [ running ] ──> [ completed ]  (Full InvestmentResearchReport generated)
                             └──> [ failed ]     (Error diagnostics recorded)
  ```
- **Errors**: `401 Unauthorized`, `422 Unprocessable Entity` (empty company or ticker).
- **Example**:
  ```bash
  curl -X POST http://localhost:8000/api/v1/research \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"company": "Apple Inc.", "ticker": "AAPL"}'
  ```

##### `GET /api/v1/research/history`
Retrieves research jobs initiated by the authenticated user, ordered newest first.
- **Authentication**: `Bearer <token>`
- **Query Parameters**:
  - `limit` *(integer, optional, default: 20)*: Number of history records to return (`1 <= limit <= 100`).
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "research": [
      {
        "job_id": "7b8f9e21-0a4e-4f2b-9c71-3f11e8a93e12",
        "company": "Apple Inc.",
        "ticker": "AAPL",
        "status": "completed",
        "created_at": "2026-09-16T12:00:00+00:00",
        "started_at": "2026-09-16T12:00:02+00:00",
        "completed_at": "2026-09-16T12:00:48+00:00"
      }
    ]
  }
  ```
- **Errors**: `401 Unauthorized`, `422 Unprocessable Entity` (limit out of range).

##### `GET /api/v1/research/{job_id}`
Polls the execution status and retrieves the complete structured research report for a job.
- **Authentication**: `Bearer <token>`
- **Path Parameters**:
  - `job_id` *(string, required)*: UUID of the research job.
- **Status**: `200 OK`
- **Response (`completed`)**:
  ```json
  {
    "job_id": "7b8f9e21-0a4e-4f2b-9c71-3f11e8a93e12",
    "status": "completed",
    "result": {
      "company": "Apple Inc.",
      "ticker": "AAPL",
      "executive_summary": "...",
      "investment_thesis": { ... },
      "financial_analysis": { ... },
      "valuation_analysis": { ... },
      "risk_analysis": { ... },
      "evidence_registry": { ... }
    },
    "error": null,
    "created_at": "2026-09-16T12:00:00+00:00",
    "started_at": "2026-09-16T12:00:02+00:00",
    "completed_at": "2026-09-16T12:00:48+00:00"
  }
  ```
- **Errors**: `401 Unauthorized`, `404 Not Found` (`{"detail": "Research job not found."}`).

---

#### 3. Watchlist

##### `GET /api/v1/watchlist`
Lists all equity tickers saved in the authenticated user's watchlist.
- **Authentication**: `Bearer <token>`
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "watchlist": [
      {
        "id": "14f08c3e-2b71-471a-a536-1e9bca9a51d3",
        "ticker": "NVDA",
        "company_name": "NVIDIA Corporation",
        "created_at": "2026-09-16T12:00:00+00:00"
      }
    ]
  }
  ```

##### `POST /api/v1/watchlist`
Adds a ticker to the authenticated user's watchlist.
- **Authentication**: `Bearer <token>`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "ticker": "NVDA",
    "company_name": "NVIDIA Corporation"
  }
  ```
  - `ticker` *(string, required)*: Ticker symbol (uppercased automatically).
  - `company_name` *(string, optional)*: Optional display name.
- **Response (`201 Created`)**:
  ```json
  {
    "id": "14f08c3e-2b71-471a-a536-1e9bca9a51d3",
    "ticker": "NVDA",
    "company_name": "NVIDIA Corporation",
    "created_at": "2026-09-16T12:00:00+00:00"
  }
  ```
- **Errors**: `401 Unauthorized`, `409 Conflict` (`{"detail": "Ticker already in watchlist"}`).

##### `DELETE /api/v1/watchlist/{item_id}`
Removes an entry from the authenticated user's watchlist.
- **Authentication**: `Bearer <token>`
- **Path Parameters**: `item_id` *(string, required)*
- **Status**: `204 No Content` (empty response body).
- **Errors**: `401 Unauthorized`, `500 Database error`.

---

#### 4. Portfolio

##### `GET /api/v1/portfolio`
Lists all equity holdings in the authenticated user's portfolio.
- **Authentication**: `Bearer <token>`
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "portfolio": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "quantity": 15.0,
        "average_cost": 175.50,
        "created_at": "2026-09-16T12:00:00+00:00",
        "updated_at": "2026-09-16T12:00:00+00:00"
      }
    ]
  }
  ```

##### `POST /api/v1/portfolio`
Adds an equity position to the authenticated user's portfolio.
- **Authentication**: `Bearer <token>`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "ticker": "AAPL",
    "company_name": "Apple Inc.",
    "quantity": 15.0,
    "average_cost": 175.50
  }
  ```
  - `ticker` *(string, required)*: Ticker symbol (trimmed and uppercased).
  - `company_name` *(string, optional)*: Company name.
  - `quantity` *(float, required)*: Number of shares. Must be a finite number `> 0`.
  - `average_cost` *(float, required)*: Cost basis per share. Must be a finite number `>= 0`.
- **Validation**: Rejects `NaN`, `Infinity`, non-positive quantities, and negative costs.
- **Errors**: `401 Unauthorized`, `409 Conflict` (`{"detail": "Ticker already in portfolio"}`), `422 Unprocessable Entity`.

##### `PATCH /api/v1/portfolio/{item_id}`
Updates share quantity and/or average cost of an existing holding.
- **Authentication**: `Bearer <token>`
- **Path Parameters**: `item_id` *(string, required)*
- **Status**: `200 OK`
- **Request Body**:
  ```json
  {
    "quantity": 25.0,
    "average_cost": 180.20
  }
  ```
- **Validation**: Same finite positive `quantity` and finite non-negative `average_cost` checks.
- **Errors**: `401 Unauthorized`, `404 Not Found` (`{"detail": "Item not found"}`), `422 Unprocessable Entity`.

##### `DELETE /api/v1/portfolio/{item_id}`
Deletes a portfolio position.
- **Authentication**: `Bearer <token>`
- **Path Parameters**: `item_id` *(string, required)*
- **Status**: `204 No Content` (empty response body).

---

#### 5. Markets & Screeners

##### `GET /api/v1/markets/quote`
Retrieves live market data, key financial ratios, and valuation multiples for a given ticker.
- **Authentication**: None
- **Query Parameters**:
  - `ticker` *(string, required)*: Ticker symbol (e.g. `?ticker=MSFT`).
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "ticker": "MSFT",
    "company": "Microsoft Corporation",
    "market_data": {
      "current_price": 420.50,
      "market_cap": 3120000000000,
      "volume": 18450000,
      "day_change_pct": 1.25,
      "fifty_two_week_high": 468.35,
      "fifty_two_week_low": 309.45
    },
    "valuation_metrics": {
      "Market Cap": 3120000000000,
      "Trailing P/E": 35.8,
      "Forward P/E": 30.2,
      "Price To Sales": 12.8,
      "Price To Book": 11.4,
      "Enterprise Value": 3150000000000,
      "Enterprise To EBITDA": 22.4
    }
  }
  ```
- **Errors**: `400 Bad Request` (missing ticker), `404 Not Found` (ticker data unavailable).

##### `GET /api/v1/markets/movers`
Fetches the top daily percentage gainers and losers from a curated universe of major equities.
- **Authentication**: None
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "gainers": [
      {
        "ticker": "NVDA",
        "company": "NVIDIA Corporation",
        "price": 125.50,
        "day_change_pct": 3.42,
        "market_cap": 3100000000000,
        "pe": 45.2,
        "dividend_yield": 0.0003
      }
    ],
    "losers": [
      {
        "ticker": "INTC",
        "company": "Intel Corporation",
        "price": 19.80,
        "day_change_pct": -2.85,
        "market_cap": 85000000000,
        "pe": null,
        "dividend_yield": 0.025
      }
    ]
  }
  ```
- **Caching**: Results cached in-memory with a 5-minute TTL to optimize external API utilization.

##### `GET /api/v1/markets/screener`
Filters stocks across the universe using numerical valuation and performance bounds.
- **Authentication**: None
- **Query Parameters** *(all optional floats)*:
  - `min_price`, `max_price`: Share price filter bounds.
  - `min_market_cap`, `max_market_cap`: Market capitalization bounds.
  - `min_pe`, `max_pe`: Trailing P/E ratio bounds.
  - `min_yield`, `max_yield`: Dividend yield percentage bounds.
- **Validation Rules**:
  - Rejects `NaN` and `Infinity` with `422 Unprocessable Entity`.
  - Rejects any filter where `min > max` with `422 Unprocessable Entity` (e.g., `{"detail": "price min cannot be greater than max"}`).
- **Status**: `200 OK`
- **Response**: Array of matching equity objects.
- **Example**:
  ```bash
  curl -s "http://localhost:8000/api/v1/markets/screener?min_market_cap=100000000000&max_pe=25"
  ```

---

## 27. Production Deployment

Alpha Terminal is architected for decoupled cloud deployment:

- **Frontend**: Deployed to **Vercel** as a static Vite SPA.
  - Root Directory: `frontend/`
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - SPA Routing: Handled via `frontend/vercel.json` rewrites.
- **Backend (Recommended)**: Deployed to **Render** as a Docker Web Service.
  - Recommended Target: Render executes the backend as a continuous container process, preserving FastAPI `BackgroundTasks` for the full duration of multi-agent CrewAI research pipelines (35–70s average) without execution timeouts.
  - Docker Entrypoint: Automatically binds to `0.0.0.0:$PORT`.
  - Probes: `GET /health` (liveness) and `GET /ready` (readiness).
- **Backend (Alternative — Vercel Serverless)**:
  - The repository root includes a `vercel.json` that routes `/(.*)` to `api/main.py` with `maxDuration: 300` for teams wishing to deploy the backend on Vercel.
  - *Note on Serverless Background Tasks*: Because standard serverless functions freeze execution when an HTTP response stream finishes, long-running background tasks in serverless environments require sufficient function duration.
- **Database & Authentication**: Managed by **Supabase**.
  - PostgreSQL schema with Row Level Security (RLS).
  - All migrations located in `supabase/migrations/` and applied via Supabase CLI.

### Required Environment Variables

#### Backend (Render / Hosting Dashboard)
| Variable | Description | Example / Recommended Value |
|---|---|---|
| `DATABASE_BACKEND` | Persistence provider (must be `supabase` in production) | `supabase` |
| `SUPABASE_URL` | Supabase project REST URL | `https://your-project-id.supabase.co` |
| `SUPABASE_SECRET_KEY` | Server-side service role key (never expose to client) | `your-supabase-service-role-secret` |
| `GEMINI_API_KEY` | Google Gemini API key for CrewAI agents | `your-gemini-api-key` |
| `SEC_USER_AGENT` | SEC EDGAR compliant user agent header | `AlphaTerminal AdminContact@your-domain.example` |
| `MARKETAUX_API_KEY` | Marketaux API key for financial news (optional) | `your-marketaux-key` |
| `RESEARCH_JOB_TIMEOUT_SECONDS` | Inactivity threshold before a running job is marked stale | `3600` |
| `CORS_ORIGINS` | JSON list or comma-separated origins (no wildcards) | `["https://your-frontend-domain.example"]` |
| `LOG_LEVEL` | Logging level | `INFO` |

#### Frontend (Vercel Project Settings)
| Variable | Description | Example / Recommended Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of deployed backend API | `https://your-backend-domain.example` |
| `VITE_SUPABASE_URL` | Supabase project REST URL | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key (browser-safe) | `your-public-anon-key` |

### Critical Security & Configuration Directives

1. **Secret Isolation**:
   - `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, and all backend credentials must **NEVER** be supplied as frontend build arguments or `VITE_*` environment variables.
   - All `VITE_*` variables are bundled directly into public client-side JavaScript assets.
2. **CORS Validation**:
   - `CORS_ORIGINS` on the backend must explicitly match the production frontend domain (`https://your-frontend-domain.example`).
   - Wildcard origins (`*`) are rejected with an explicit error on application startup for security.
3. **Supabase Auth Redirect Configuration**:
   - In Supabase Dashboard (**Authentication > URL Configuration**):
     - **Site URL**: `https://your-frontend-domain.example`
     - **Redirect URLs**:
       - `https://your-frontend-domain.example/**`
       - `http://localhost:5173/**` (for local development)

## 28. Security Notes
- The `SUPABASE_SECRET_KEY` resides strictly on the backend.
- The frontend only utilizes the `SUPABASE_ANON_KEY`.
- Backend endpoints derive the authenticated user identity from the verified Supabase access token and do not allow client-supplied user IDs.
- Supabase RLS policies enforce user-scoped access to protected application data.

## 29. Known Limitations
- The Screener currently operates on a bounded ticker universe (e.g., major indices) to prevent breaching free-tier API rate limits.
- Yahoo Finance (`yfinance`) dependency is subject to upstream rate-limiting or layout changes.
- Research history retrieves a maximum of 100 recent jobs.

## 30. Future Roadmap
- **Production Observability**: Implement Sentry / Datadog for tracing asynchronous AI workflows.
- **Expanded Universe**: Shift to a commercial data vendor (e.g., Polygon.io) for an unbounded market screener.
- **Websockets**: Transition from HTTP polling to Websockets for live research progress updates.
- **Deployment Automation**: Automate production deployments through the existing CI pipeline.
