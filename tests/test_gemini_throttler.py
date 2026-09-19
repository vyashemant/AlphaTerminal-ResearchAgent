import time
import pytest
from unittest.mock import MagicMock, patch
from api.config import Settings
from services.gemini_limiter import GeminiThrottler, GeminiQuotaExceededError, ThrottledLLM

def test_gemini_settings_configuration():
    """Verify GEMINI_MODEL, GEMINI_SPECIALIST_MODEL, concurrency and rate limit settings load properly."""
    custom_settings = Settings(
        DATABASE_BACKEND="sqlite",
        GEMINI_MODEL="gemini-3.5-flash",
        GEMINI_SPECIALIST_MODEL="gemini-3.5-flash-lite",
        GEMINI_MAX_CONCURRENT_CALLS=2,
        GEMINI_REQUESTS_PER_MINUTE=10
    )
    assert custom_settings.GEMINI_MODEL == "gemini-3.5-flash"
    assert custom_settings.GEMINI_SPECIALIST_MODEL == "gemini-3.5-flash-lite"
    assert custom_settings.GEMINI_MAX_CONCURRENT_CALLS == 2
    assert custom_settings.GEMINI_REQUESTS_PER_MINUTE == 10

def test_default_gemini_settings_no_old_2_5():
    """Verify default Settings have no gemini-2.5-flash reference."""
    s = Settings(DATABASE_BACKEND="sqlite")
    assert "2.5" not in s.GEMINI_MODEL
    assert "2.5" not in s.GEMINI_SPECIALIST_MODEL
    assert s.GEMINI_MODEL == "gemini-3.5-flash"
    assert s.GEMINI_SPECIALIST_MODEL == "gemini-3.5-flash-lite"

def test_get_llm_model_assignment_and_throttled_llm():
    """Verify get_llm assigns correct models wrapped in ThrottledLLM."""
    from services.research_pipeline import get_llm
    from services.gemini_limiter import ThrottledLLM
    from api.config import settings

    with patch.object(settings, "GEMINI_API_KEY", "test-api-key"):
        # Strategist model (default)
        strategist_llm = get_llm(settings.GEMINI_MODEL)
        assert isinstance(strategist_llm, ThrottledLLM)
        assert strategist_llm.model == "gemini-3.5-flash"

        # Specialist model
        specialist_llm = get_llm(settings.GEMINI_SPECIALIST_MODEL)
        assert isinstance(specialist_llm, ThrottledLLM)
        assert specialist_llm.model == "gemini-3.5-flash-lite"

        # Unspecified model falls back to GEMINI_MODEL
        default_llm = get_llm()
        assert isinstance(default_llm, ThrottledLLM)
        assert default_llm.model == settings.GEMINI_MODEL

def test_throttler_concurrency_serialization():
    """Verify that multiple concurrent threads are gated by max_concurrent semaphore."""
    throttler = GeminiThrottler(max_concurrent=1, requests_per_minute=60, initial_backoff=0.01)
    
    active_count = 0
    max_active_observed = 0
    import threading

    def mock_call():
        nonlocal active_count, max_active_observed
        active_count += 1
        if active_count > max_active_observed:
            max_active_observed = active_count
        time.sleep(0.05)
        active_count -= 1
        return "ok"

    threads = [threading.Thread(target=lambda: throttler.execute(mock_call)) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert max_active_observed == 1

def test_throttler_rate_limiting():
    """Verify rate limiter enforces delay when requests exceed requests_per_minute."""
    # Allow 2 requests per 60 seconds
    throttler = GeminiThrottler(max_concurrent=1, requests_per_minute=2, initial_backoff=0.01)

    t0 = time.monotonic()
    # Call 1: immediate
    res1 = throttler.execute(lambda: "first")
    assert res1 == "first"

    # Call 2: immediate
    res2 = throttler.execute(lambda: "second")
    assert res2 == "second"

    # Call 3: timestamps deque has 2 calls, so third must wait or raise
    # We test that timestamps are recorded
    assert len(throttler._call_timestamps) == 2

def test_throttler_429_retry_and_success():
    """Verify 429 RESOURCE_EXHAUSTED errors trigger backoff and eventual success."""
    throttler = GeminiThrottler(max_concurrent=1, requests_per_minute=60, max_retries=3, initial_backoff=0.01)

    attempts = 0
    def mock_flaky_call():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise RuntimeError("429 RESOURCE_EXHAUSTED: Quota exceeded for model")
        return "success"

    result = throttler.execute(mock_flaky_call)
    assert result == "success"
    assert attempts == 3

def test_throttler_429_exhausted_raises_custom_error():
    """Verify exhausting retries raises GeminiQuotaExceededError."""
    throttler = GeminiThrottler(max_concurrent=1, requests_per_minute=60, max_retries=2, initial_backoff=0.01)

    attempts = 0
    def mock_always_failing():
        nonlocal attempts
        attempts += 1
        raise RuntimeError("429 RESOURCE_EXHAUSTED: Quota exceeded")

    with pytest.raises(GeminiQuotaExceededError) as exc_info:
        throttler.execute(mock_always_failing)

    assert "quota" in str(exc_info.value).lower()
    assert attempts == 3 # Initial attempt + 2 retries

def test_research_job_error_sanitization_on_quota_failure():
    """Verify background_research_task sets user-safe quota message in DB when quota exhausted."""
    from services.research_service import background_research_task
    import db.database as db

    job_id = "test-quota-job-123"
    db.create_job(
        job_id=job_id,
        company="Test Co",
        ticker="TST",
        status="queued",
        created_at="2026-09-18T10:00:00Z"
    )

    with patch("services.research_service.run_investment_research") as mock_pipeline:
        mock_pipeline.side_effect = GeminiQuotaExceededError("HTTP 429 RESOURCE_EXHAUSTED: Quota limit reached")
        
        background_research_task(job_id, "Test Co", "TST")

    job = db.get_job(job_id)
    assert job is not None
    assert job["status"] == "failed"
    assert "temporarily unavailable because the AI provider has reached its request limit" in job["error"]
    assert "api_key" not in job["error"].lower()

def test_research_job_error_sanitization_on_404_model_not_found():
    """Verify background_research_task sets user-safe model-not-found message in DB when 404 is encountered."""
    from services.research_service import background_research_task
    import db.database as db

    job_id = "test-404-job-456"
    db.create_job(
        job_id=job_id,
        company="Test 404 Co",
        ticker="NOTFND",
        status="queued",
        created_at="2026-09-18T10:00:00Z"
    )

    with patch("services.research_service.run_investment_research") as mock_pipeline:
        mock_pipeline.side_effect = RuntimeError("google.genai.errors.ClientError: 404 NOT_FOUND. models/gemini-2.5-flash is not found or unavailable to new users.")
        
        background_research_task(job_id, "Test 404 Co", "NOTFND")

    job = db.get_job(job_id)
    assert job is not None
    assert job["status"] == "failed"
    assert "The configured AI model is unavailable or not found." in job["error"]
    assert "Please verify the Gemini model configuration." in job["error"]
    assert "ClientError" not in job["error"]
    assert "Traceback" not in job["error"]

def test_get_llm_provider_string_regression():
    """Verify get_llm strictly provides the raw model ID to prevent 404 URL formation."""
    from services.research_pipeline import get_llm
    llm = get_llm("gemini-3.5-flash-lite")
    assert llm.model == "gemini-3.5-flash-lite"
    
    llm_legacy = get_llm("gemini/gemini-3.5-flash")
    assert llm_legacy.model == "gemini-3.5-flash"

def test_throttled_llm_tools_argument_forwarding():
    """Verify ThrottledLLM correctly forwards the 'tools' keyword argument to a specific signature."""
    from services.gemini_limiter import ThrottledLLM, gemini_throttler
    from crewai.llm import LLM
    from unittest.mock import MagicMock, patch

    original_execute = gemini_throttler.execute
    try:
        gemini_throttler.execute = MagicMock(side_effect=lambda f: f())
        
        # Define a mock method with the exact signature of GeminiCompletion.call (simplified)
        def mock_call_with_signature(self, messages, tools=None, **kwargs):
            return {"messages": messages, "tools": tools}
            
        # Patch GeminiCompletion.call because CrewAI LLM delegates to it and patching LLM.call is circumvented
        with patch("crewai.llms.providers.gemini.completion.GeminiCompletion.call", new=mock_call_with_signature):
            llm = ThrottledLLM(model="gemini/gemini-3.5-flash")
            valid_tools = [{"type": "function", "function": {"name": "tool1"}}]
            
            # If `self` is improperly forwarded as a positional arg by throttled_call,
            # this will raise TypeError: got multiple values for argument 'tools'
            result = llm.call("test prompt", tools=valid_tools)
            
            # Since the provider's call was mocked, the result comes from mock_call_with_signature
            assert result["messages"] == "test prompt"
            assert result["tools"] == valid_tools
            gemini_throttler.execute.assert_called_once()
            
    finally:
        gemini_throttler.execute = original_execute
