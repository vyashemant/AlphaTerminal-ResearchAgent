import time
import logging
import threading
from collections import deque
from typing import Callable, Any, Optional
from crewai import LLM
from api.config import settings

logger = logging.getLogger(__name__)

class GeminiQuotaExceededError(RuntimeError):
    """Raised when Gemini rate/quota limits are exhausted after retries."""
    pass

class GeminiThrottler:
    """
    Thread-safe concurrency and rate limiter with exponential backoff
    for Gemini LLM requests.
    """
    def __init__(
        self,
        max_concurrent: Optional[int] = None,
        requests_per_minute: Optional[int] = None,
        max_retries: int = 3,
        initial_backoff: float = 5.0,
        backoff_factor: float = 2.0,
        max_backoff: float = 60.0
    ):
        self.max_concurrent = max_concurrent or getattr(settings, "GEMINI_MAX_CONCURRENT_CALLS", 1)
        self.requests_per_minute = requests_per_minute or getattr(settings, "GEMINI_REQUESTS_PER_MINUTE", 4)
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.backoff_factor = backoff_factor
        self.max_backoff = max_backoff

        self._semaphore = threading.Semaphore(self.max_concurrent)
        self._rate_lock = threading.Lock()
        self._call_timestamps: deque = deque()

    def _wait_for_rate_slot(self):
        """Ensure we do not exceed requests_per_minute within a sliding 60s window."""
        while True:
            with self._rate_lock:
                now = time.monotonic()
                # Prune timestamps older than 60 seconds
                while self._call_timestamps and (now - self._call_timestamps[0] >= 60.0):
                    self._call_timestamps.popleft()

                if len(self._call_timestamps) < self.requests_per_minute:
                    self._call_timestamps.append(now)
                    return

                # Must wait until the oldest timestamp exits the 60s window
                wait_time = 60.0 - (now - self._call_timestamps[0]) + 0.1

            logger.info(f"Gemini rate limit threshold reached ({self.requests_per_minute} RPM). Throttling for {wait_time:.2f}s...")
            time.sleep(wait_time)

    def _is_rate_limit_error(self, exception: Exception) -> bool:
        """Detect whether an exception is an HTTP 429 or quota exhaustion."""
        err_msg = str(exception).lower()
        if "429" in err_msg or "resource_exhausted" in err_msg or "quota exceeded" in err_msg:
            return True
        if "ratelimit" in err_msg or "rate limit" in err_msg:
            return True
        # Check for status_code attribute on client errors
        status_code = getattr(exception, "status_code", None) or getattr(exception, "code", None)
        if status_code in (429, "429"):
            return True
        return False

    def _extract_retry_delay(self, exception: Exception, default_delay: float) -> float:
        """Extract Retry-After header or delay info from exception if available."""
        retry_after = getattr(exception, "retry_after", None)
        if retry_after is not None:
            try:
                return min(float(retry_after), self.max_backoff)
            except (ValueError, TypeError):
                pass
        return default_delay

    def execute(self, func: Callable[[], Any]) -> Any:
        """
        Execute an LLM function call under concurrency control, rate limiting,
        and exponential backoff for 429 RESOURCE_EXHAUSTED errors.
        """
        attempt = 0
        backoff = self.initial_backoff

        while True:
            # Enforce concurrency limit
            with self._semaphore:
                # Enforce rate limit
                self._wait_for_rate_slot()

                try:
                    return func()
                except Exception as e:
                    if not self._is_rate_limit_error(e):
                        # Non-quota error, raise immediately
                        raise

                    attempt += 1
                    retry_delay = self._extract_retry_delay(e, backoff)

                    if attempt > self.max_retries:
                        logger.error(
                            f"Gemini quota exhausted after {self.max_retries} retries: {e}"
                        )
                        raise GeminiQuotaExceededError(
                            f"Gemini API rate/quota limit exceeded (HTTP 429 RESOURCE_EXHAUSTED). "
                            f"Attempts: {attempt}/{self.max_retries}. Detail: {e}"
                        ) from e

                    logger.warning(
                        f"Gemini 429 rate limit hit. Retrying in {retry_delay:.1f}s "
                        f"(attempt {attempt}/{self.max_retries}). Detail: {e}"
                    )

            # Sleep outside the semaphore so other threads or operations are not blocked
            time.sleep(retry_delay)
            backoff = min(backoff * self.backoff_factor, self.max_backoff)


# Process-wide singleton throttler instance
gemini_throttler = GeminiThrottler()


class ThrottledLLM(LLM):
    """
    CrewAI LLM wrapper that routes all model calls through the centralized GeminiThrottler.
    Guarantees concurrency and rate limiting even when specialist agents execute in parallel.
    """
    def __new__(cls, *args, **kwargs):
        instance = LLM(*args, **kwargs)
        orig_call = instance.call

        def throttled_call(self, *c_args, **c_kwargs):
            return gemini_throttler.execute(lambda: orig_call(*c_args, **c_kwargs))

        base_cls = instance.__class__
        subclass = type(f"Throttled{base_cls.__name__}", (ThrottledLLM, base_cls), {"call": throttled_call})
        instance.__class__ = subclass
        return instance

    def call(
        self,
        messages,
        tools=None,
        callbacks=None,
        available_functions=None,
        from_task=None,
        from_agent=None,
        response_model=None,
    ) -> Any:
        return gemini_throttler.execute(
            lambda: super(ThrottledLLM, self).call(
                messages=messages,
                tools=tools,
                callbacks=callbacks,
                available_functions=available_functions,
                from_task=from_task,
                from_agent=from_agent,
                response_model=response_model,
            )
        )
