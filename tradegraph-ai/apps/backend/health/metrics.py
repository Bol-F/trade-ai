import secrets

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest


def metrics(request: HttpRequest) -> HttpResponse:
    configured = settings.METRICS_BEARER_TOKEN
    supplied = request.headers.get("Authorization", "").removeprefix("Bearer ")
    if not settings.METRICS_ALLOW_UNAUTHENTICATED and (
        not configured or not secrets.compare_digest(supplied, configured)
    ):
        return HttpResponse("Not found.", status=404, content_type="text/plain")
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
