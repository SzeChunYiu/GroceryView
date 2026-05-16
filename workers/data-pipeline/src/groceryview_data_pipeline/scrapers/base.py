"""Shared retailer scraper contracts, HTTP client, snapshots, and guardrails."""

import hashlib
import urllib.robotparser
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime, time
from typing import Any, Protocol
from urllib.parse import urlparse

import httpx
import orjson
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from groceryview_data_pipeline.resources.settings import PipelineSettings, get_settings
from groceryview_data_pipeline.schemas.observations import RetailerFetchResult

DISALLOWED_CONTEXTS = (
    "account",
    "checkout",
    "cart",
    "payment",
    "login",
    "search bypass",
)


@dataclass(frozen=True)
class SourceCompliance:
    """Operational/legal guardrails collected from docs/data-sources.md."""

    source_name: str
    robots_url: str
    crawl_delay_seconds: int | None = None
    visit_start_utc: time | None = None
    visit_end_utc: time | None = None
    requires_partner_approval: bool = False
    notes: tuple[str, ...] = (
        "respect robots.txt",
        "do not crawl checkout/account/cart/private user endpoints",
        "do not treat frontend API keys as backend permission",
        "cache aggressively and keep source URL/timestamp",
    )

    def within_visit_window(self, now: datetime | None = None) -> bool:
        if self.visit_start_utc is None or self.visit_end_utc is None:
            return True
        current = (now or datetime.now(tz=UTC)).time()
        return self.visit_start_utc <= current <= self.visit_end_utc


@dataclass(frozen=True)
class RateLimit:
    minimum_seconds_between_requests: int


class RetailerScraper(Protocol):
    """Protocol implemented by every retailer-specific fetcher."""

    source_name: str
    compliance: SourceCompliance
    rate_limit: RateLimit

    async def fetch(self, *args: Any, **kwargs: Any) -> RetailerFetchResult:
        """Fetch and parse source data into normalized observation models."""


def snapshot_hash(payload: bytes | str | Mapping[str, Any] | list[Any]) -> str:
    """Create a stable SHA-256 hash for raw JSON/HTML snapshots."""

    if isinstance(payload, bytes):
        raw = payload
    elif isinstance(payload, str):
        raw = payload.encode("utf-8")
    else:
        raw = orjson.dumps(payload, option=orjson.OPT_SORT_KEYS)
    return hashlib.sha256(raw).hexdigest()


def assert_public_source_url(url: str) -> None:
    """Reject endpoints that would bypass account/cart/checkout/search guardrails."""

    lowered = url.lower()
    if any(context in lowered for context in DISALLOWED_CONTEXTS):
        raise ValueError(f"Refusing guarded/private URL context: {url}")


def configured_async_client(settings: PipelineSettings | None = None) -> httpx.AsyncClient:
    """Build an HTTP client with an explicit GroceryView User-Agent."""

    active_settings = settings or get_settings()
    return httpx.AsyncClient(
        headers={"User-Agent": active_settings.user_agent, "Accept": "application/json,text/html"},
        timeout=httpx.Timeout(30.0),
        follow_redirects=False,
    )


def robots_allowed(url: str, user_agent: str, robots_txt: str) -> bool:
    """Evaluate robots.txt text for a candidate URL."""

    parser = urllib.robotparser.RobotFileParser()
    parser.parse(robots_txt.splitlines())
    return parser.can_fetch(user_agent, url)


def source_host(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f"Expected absolute source URL, got {url}")
    return parsed.netloc


# Reusable retry policy: three attempts with exponential backoff for transient HTTP issues.
def retry_transient_fetch[T](func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
    return retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.TransportError)),
        wait=wait_exponential(multiplier=1, min=1, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )(func)
