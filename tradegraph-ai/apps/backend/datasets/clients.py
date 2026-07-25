from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date
from typing import Any

from django.conf import settings
from django.core.cache import cache

ALLOWED_EXTERNAL_HOSTS = {"api.worldbank.org", "comtradeapi.un.org"}


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        parsed = urllib.parse.urlparse(newurl)
        if parsed.scheme != "https" or parsed.hostname not in ALLOWED_EXTERNAL_HOSTS:
            raise urllib.error.URLError("External API redirect target is not allowlisted.")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _validate_external_url(url: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if (
        parsed.scheme != "https"
        or parsed.hostname not in ALLOWED_EXTERNAL_HOSTS
        or parsed.username
        or parsed.password
        or parsed.port not in {None, 443}
    ):
        raise ValueError("External API URL is not allowlisted.")


@dataclass(frozen=True)
class ExternalResponse:
    data: Any
    provenance: dict[str, Any]


def _get_json(url: str, headers: dict[str, str] | None = None) -> Any:
    _validate_external_url(url)
    opener = urllib.request.build_opener(SafeRedirectHandler())
    attempts = 3
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers=headers or {})  # noqa: S310 -- URL is allowlisted above.
            with opener.open(request, timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS) as response:
                _validate_external_url(response.geturl())
                return json.load(response)
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            time.sleep(2**attempt)
    raise RuntimeError("External request failed.")


class WorldBankClient:
    base_url = "https://api.worldbank.org/v2"

    def fetch_indicator(self, country: str, indicator: str) -> ExternalResponse:
        if indicator not in settings.WORLD_BANK_INDICATORS:
            raise ValueError("Indicator is not allowlisted.")
        url = (
            f"{self.base_url}/country/{urllib.parse.quote(country)}/indicator/"
            f"{urllib.parse.quote(indicator)}?format=json&per_page=1000"
        )
        key = f"external:world-bank:{country}:{indicator}"
        data = cache.get(key)
        if data is None:
            data = _get_json(url)
            cache.set(key, data, timeout=86400)
        return ExternalResponse(
            data,
            {
                "source": "World Bank API",
                "url": url,
                "indicator": indicator,
                "retrieved_on": date.today().isoformat(),
            },
        )


class ComtradeClient:
    base_url = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"

    @property
    def enabled(self) -> bool:
        return bool(settings.UN_COMTRADE_API_KEY)

    def fetch(self, params: dict[str, str]) -> ExternalResponse:
        if not self.enabled:
            raise RuntimeError("UN Comtrade is disabled because no API key is configured.")
        counter_key = f"external:comtrade:requests:{date.today().isoformat()}"
        try:
            count = cache.incr(counter_key)
        except ValueError:
            cache.set(counter_key, 1, timeout=172800)
            count = 1
        if count > settings.UN_COMTRADE_DAILY_LIMIT:
            raise RuntimeError("UN Comtrade daily request limit reached.")
        time.sleep(settings.UN_COMTRADE_MIN_INTERVAL_SECONDS)
        query = urllib.parse.urlencode(params)
        url = f"{self.base_url}?{query}"
        data = _get_json(url, {"Ocp-Apim-Subscription-Key": settings.UN_COMTRADE_API_KEY})
        cache.set(
            "external:comtrade:checkpoint",
            {"parameters": params, "completed_on": date.today().isoformat()},
            timeout=None,
        )
        return ExternalResponse(
            data,
            {
                "source": "UN Comtrade API",
                "url": self.base_url,
                "parameters": params,
                "retrieved_on": date.today().isoformat(),
                "daily_request_number": count,
            },
        )
