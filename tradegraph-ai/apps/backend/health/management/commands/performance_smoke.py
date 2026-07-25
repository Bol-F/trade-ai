import json
import logging
import statistics
import time
from typing import Any, cast

from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import connection, reset_queries
from django.http import HttpResponse
from django.test import Client


class Command(BaseCommand):
    help = "Measure representative public API query counts, latency, and payload sizes."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--iterations", type=int, default=20)

    def handle(self, *args: Any, **options: Any) -> None:
        client = Client(headers={"host": "localhost"})
        logging.disable(logging.INFO)
        connection.force_debug_cursor = True
        iterations = max(options["iterations"], 2)
        cases = [
            ("countries", "get", "/api/v1/countries", None),
            ("products", "get", "/api/v1/products", None),
            ("overview", "get", "/api/v1/trade/overview", None),
            ("timeseries", "get", "/api/v1/trade/timeseries", None),
            ("partners", "get", "/api/v1/trade/partners", None),
            ("map", "get", "/api/v1/trade/map?top=25", None),
            ("anomalies", "get", "/api/v1/analytics/anomalies", None),
            ("country-profile", "get", "/api/v1/analytics/country-profile/UZB", None),
            ("product-profile", "get", "/api/v1/analytics/product-profile/01", None),
            (
                "forecast",
                "post",
                "/api/v1/ml/forecast",
                {"importer": "CHN", "exporter": "UZB", "hs2": "01", "year": 2025},
            ),
            (
                "suppliers",
                "post",
                "/api/v1/ml/supplier-recommendations",
                {"importer": "USA", "hs2": "01", "year": 2024},
            ),
        ]
        report: dict[str, Any] = {}
        for name, method, url, payload in cases:
            cache.clear()
            reset_queries()
            started = time.perf_counter()
            response = self._request(client, method, url, payload)
            uncached_ms = (time.perf_counter() - started) * 1_000
            query_count = len(connection.queries)
            durations = []
            for _ in range(iterations):
                started = time.perf_counter()
                self._request(client, method, url, payload)
                durations.append((time.perf_counter() - started) * 1_000)
            report[name] = {
                "status": response.status_code,
                "uncached_queries": query_count,
                "uncached_ms": round(uncached_ms, 2),
                "warm_p95_ms": round(self._percentile(durations, 0.95), 2),
                "payload_bytes": len(response.content),
            }
        self.stdout.write(json.dumps(report, indent=2))
        connection.force_debug_cursor = False
        logging.disable(logging.NOTSET)

    @staticmethod
    def _request(
        client: Client, method: str, url: str, payload: dict[str, Any] | None
    ) -> HttpResponse:
        if method == "post":
            return cast(
                HttpResponse,
                client.post(url, data=json.dumps(payload), content_type="application/json"),
            )
        return cast(HttpResponse, client.get(url))

    @staticmethod
    def _percentile(values: list[float], percentile: float) -> float:
        if len(values) == 1:
            return values[0]
        return statistics.quantiles(values, n=100, method="inclusive")[
            max(0, min(99, round(percentile * 100) - 1))
        ]
