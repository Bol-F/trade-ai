from unittest.mock import Mock, patch

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_liveness(api_client: APIClient) -> None:
    response = api_client.get(reverse("health-live"))
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("health.views.Redis.from_url")
def test_readiness_when_dependencies_are_available(
    redis_from_url: Mock, api_client: APIClient
) -> None:
    redis_from_url.return_value.ping.return_value = True
    response = api_client.get(reverse("health-ready"))
    assert response.status_code == 200
    assert response.json()["checks"] == {"postgres": True, "redis": True}


@patch("health.views.Redis.from_url")
def test_readiness_when_redis_is_unavailable(redis_from_url: Mock, api_client: APIClient) -> None:
    from redis.exceptions import ConnectionError

    redis_from_url.return_value.ping.side_effect = ConnectionError
    response = api_client.get(reverse("health-ready"))
    assert response.status_code == 503
    assert response.json()["checks"]["redis"] is False
