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

## 26. Production/Deployment Notes
- The backend should be deployed to a scalable provider (e.g. Render, AWS, GCP) running the Docker container or via an ASGI server.
- The frontend can be served via the Docker container (which uses nginx) or deployed statically to Vercel, Netlify, or an S3 bucket.
- Set `DATABASE_BACKEND=supabase` in production.

## 27. Security Notes
- The `SUPABASE_SECRET_KEY` resides strictly on the backend.
- The frontend only utilizes the `SUPABASE_ANON_KEY`.
- Backend endpoints derive the authenticated user identity from the verified Supabase access token and do not allow client-supplied user IDs.
- Supabase RLS policies enforce user-scoped access to protected application data.

## 28. Known Limitations
- The Screener currently operates on a bounded ticker universe (e.g., major indices) to prevent breaching free-tier API rate limits.
- Yahoo Finance (`yfinance`) dependency is subject to upstream rate-limiting or layout changes.
- Research history retrieves a maximum of 100 recent jobs.

## 29. Future Roadmap
- **Production Observability**: Implement Sentry / Datadog for tracing asynchronous AI workflows.
- **Expanded Universe**: Shift to a commercial data vendor (e.g., Polygon.io) for an unbounded market screener.
- **Websockets**: Transition from HTTP polling to Websockets for live research progress updates.
- **Deployment Automation**: Automate production deployments through the existing CI pipeline.
