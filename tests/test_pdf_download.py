import pytest
from fastapi.testclient import TestClient
from api.main import app
from db.database import set_testing_mode, clear_mock_db, get_db
import json
from datetime import datetime, timezone
import io
from pypdf import PdfReader
from unittest.mock import patch

from agents.investment_research_report import (
    InvestmentResearchReport,
    MarketSnapshot,
    FinancialSummary,
    FinancialMetrics,
    SpecialistReports,
    DataSources,
    EvidenceRegistry,
    EvidenceItem
)
from agents.investment_strategist import InvestmentStrategy

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    set_testing_mode(True)
    clear_mock_db()
    yield
    clear_mock_db()

@pytest.fixture
def auth_client():
    from api.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"id": "test_user", "email": "test@test.com"}
    yield client
    app.dependency_overrides.clear()

@pytest.fixture
def other_user_client():
    from api.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"id": "other_user", "email": "other@test.com"}
    yield client
    app.dependency_overrides.clear()

def create_mock_report() -> InvestmentResearchReport:
    market_snapshot = MarketSnapshot(
        source="Yahoo",
        current_price=150.0,
        previous_close=148.0,
        day_high=152.0,
        day_low=149.0,
        week_52_high=180.0,
        week_52_low=120.0,
        volume=50000000,
        average_volume=60000000,
        market_cap=2500000000.0,
        beta=1.2,
        dividend_yield=0.015
    )
    financial_summary = FinancialSummary(
        revenue=394000000000.0,
        gross_profit=170000000000.0,
        operating_income=114000000000.0,
        net_income=99000000000.0,
        operating_cash_flow=104000000000.0,
        total_assets=352000000000.0,
        total_liabilities=288000000000.0,
        stockholders_equity=64000000000.0,
        cash_and_equivalents=48000000000.0,
        total_debt=119000000000.0,
        capital_expenditure=-10000000000.0
    )
    financial_metrics = FinancialMetrics(
        free_cash_flow=94000000000.0,
        gross_margin=0.43,
        operating_margin=0.29,
        net_margin=0.25,
        return_on_equity=1.5,
        return_on_assets=0.28,
        current_ratio=1.1,
        debt_to_equity=1.8,
        trailing_pe=25.0,
        price_to_sales=6.0,
        price_to_book=39.0
    )
    specialist_reports = SpecialistReports(
        financial_analyst="Good financials",
        market_news_analyst="Good news",
        valuation_analyst="Fairly valued",
        risk_analyst="Low risk"
    )
    investment_strategy = InvestmentStrategy(
        recommendation="BUY",
        confidence="HIGH",
        investment_thesis="Apple is a strong company with <special> & characters.",
        company_quality="High",
        fundamental_assessment="Solid fundamentals",
        market_and_news_assessment="Positive sentiment",
        valuation_view="Fair valuation",
        valuation_assessment="Fairly valued relative to peers",
        risk_assessment="Minimal risk.",
        bull_case="Goes up 20%",
        base_case="Steady",
        bear_case="Goes down 10%",
        key_catalysts=["New product launch"],
        key_risks=["Supply chain issues & tariffs"],
        thesis_change_triggers=["Management change"],
        evidence_summary="Clear evidence.",
        information_limitations="Some data missing."
    )
    data_sources = DataSources()
    evidence_registry = EvidenceRegistry()
    
    return InvestmentResearchReport(
        company="Apple Inc.",
        ticker="AAPL",
        research_date="2026-09-19",
        market_snapshot=market_snapshot,
        financial_summary=financial_summary,
        financial_metrics=financial_metrics,
        news="Lots of Apple news.",
        specialist_reports=specialist_reports,
        investment_strategy=investment_strategy,
        data_sources=data_sources,
        evidence_registry=evidence_registry
    )

def test_pdf_generation_direct():
    from services.research_pdf import generate_research_pdf
    
    report = create_mock_report()
    
    # Test that PDF generation works with the real Pydantic object
    pdf_bytes = generate_research_pdf(report)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF-")
    
    # Verify content extraction
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text()
        
    assert "Apple Inc. (AAPL)" in text
    assert "Recommendation: BUY" in text
    assert "Confidence: HIGH" in text
    assert "Apple is a strong company with <special> & characters." in text
    assert "Minimal risk." in text
    assert "Goes up 20%" in text
    assert "Steady" in text
    assert "Goes down 10%" in text
    assert "394.00B" in text or "394,000,000,000" in text or "$394.00B" in text # Revenue metric check
    
    # Check that DataSources doesn't contain "Unknown" if we have defaults/empty
    assert "Unknown" not in text[text.find("DATA SOURCES"):]
def test_pdf_generation_long_text():
    from services.research_pdf import generate_research_pdf
    
    report = create_mock_report()
    report.investment_strategy.investment_thesis = "This is a very long text. " * 1000
    
    pdf_bytes = generate_research_pdf(report)
    assert len(pdf_bytes) > 0
    reader = PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) > 1

def test_download_completed_job(auth_client):
    report = create_mock_report()
    
    with patch("api.main.get_research_job") as mock_get_job:
        mock_get_job.return_value = {
            "job_id": "job_completed_123",
            "status": "completed",
            "result": report,
            "user_id": "test_user",
            "ticker": "AAPL"
        }
        
        response = auth_client.get("/api/v1/research/job_completed_123/download")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment; filename=\"alpha-terminal-AAPL" in response.headers["content-disposition"]
        
        pdf_content = response.content
        assert pdf_content.startswith(b"%PDF-")
        
        # Verify content from the endpoint response
        reader = PdfReader(io.BytesIO(pdf_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
            
        assert "Apple Inc. (AAPL)" in text
        assert "Recommendation: BUY" in text

def test_download_missing_job(auth_client):
    response = auth_client.get("/api/v1/research/invalid_job/download")
    assert response.status_code == 404
    assert response.json()["detail"] == "Research job not found."

def test_download_other_user_job(other_user_client):
    db = get_db()
    
    db.create_job(
        job_id="job_test_user_456",
        company="Test",
        ticker="TEST",
        status="completed",
        created_at=datetime.now(timezone.utc).isoformat(),
        user_id="test_user"
    )
    db.update_job(
        job_id="job_test_user_456",
        status="completed",
        result_json=json.dumps({"ticker": "TEST"})
    )
    
    response = other_user_client.get("/api/v1/research/job_test_user_456/download")
    assert response.status_code == 404

def test_download_queued_job(auth_client):
    db = get_db()
    db.create_job(
        job_id="job_queued",
        company="Test",
        ticker="TEST",
        status="queued",
        created_at=datetime.now(timezone.utc).isoformat(),
        user_id="test_user"
    )
    
    response = auth_client.get("/api/v1/research/job_queued/download")
    assert response.status_code == 409

def test_download_running_job(auth_client):
    db = get_db()
    db.create_job(
        job_id="job_running",
        company="Test",
        ticker="TEST",
        status="running",
        created_at=datetime.now(timezone.utc).isoformat(),
        user_id="test_user"
    )
    
    response = auth_client.get("/api/v1/research/job_running/download")
    assert response.status_code == 409

def test_download_failed_job(auth_client):
    db = get_db()
    db.create_job(
        job_id="job_failed",
        company="Test",
        ticker="TEST",
        status="failed",
        created_at=datetime.now(timezone.utc).isoformat(),
        user_id="test_user"
    )
    
    response = auth_client.get("/api/v1/research/job_failed/download")
    assert response.status_code == 409
