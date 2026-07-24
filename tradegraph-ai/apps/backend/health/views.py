from typing import Any

from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from drf_spectacular.utils import extend_schema
from redis import Redis
from redis.exceptions import RedisError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class LivenessView(APIView):
    authentication_classes: list[type[Any]] = []
    permission_classes: list[type[Any]] = []

    @extend_schema(responses=dict)
    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class ReadinessView(APIView):
    authentication_classes: list[type[Any]] = []
    permission_classes: list[type[Any]] = []

    @extend_schema(responses=dict)
    def get(self, request: Request) -> Response:
        checks = {"postgres": False, "redis": False}
        try:
            connections["default"].cursor().execute("SELECT 1")
            checks["postgres"] = True
        except OperationalError:
            pass

        try:
            checks["redis"] = bool(Redis.from_url(settings.REDIS_URL).ping())
        except RedisError:
            pass

        ready = all(checks.values())
        return Response(
            {"status": "ok" if ready else "unavailable", "checks": checks},
            status=200 if ready else 503,
        )
