from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse
from prometheus_client import Counter, Histogram

from audit.models import AuditEvent

logger = logging.getLogger("tradegraph.requests")
REQUESTS = Counter(
    "tradegraph_http_requests_total", "HTTP requests", ("method", "endpoint", "status")
)
DURATION = Histogram(
    "tradegraph_http_request_duration_seconds", "HTTP duration", ("method", "endpoint")
)


class RequestObservabilityMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        started = time.perf_counter()
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        try:
            parsed_request_id = uuid.UUID(request_id)
        except ValueError:
            parsed_request_id = uuid.uuid4()
            request_id = str(parsed_request_id)
        response = self.get_response(request)
        duration = time.perf_counter() - started
        endpoint = request.resolver_match.route if request.resolver_match else request.path
        user_id = (
            str(request.user.pk)
            if hasattr(request, "user") and request.user.is_authenticated
            else None
        )
        response["X-Request-ID"] = request_id
        REQUESTS.labels(request.method, endpoint, str(response.status_code)).inc()
        DURATION.labels(request.method, endpoint).observe(duration)
        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "endpoint": endpoint,
                "duration": round(duration, 6),
                "status_code": response.status_code,
                "task_id": None,
                "dataset_version": None,
                "model_version": None,
            },
        )
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and user_id:
            AuditEvent.objects.create(
                user_id=user_id,
                action=f"http.{request.method.lower()}",
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                request_id=parsed_request_id,
                metadata={},
            )
        return response
