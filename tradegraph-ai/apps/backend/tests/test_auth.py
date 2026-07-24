from typing import Any

import pytest
from accounts.models import User
from accounts.permissions import IsAdminRole
from django.core.cache import cache
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

pytestmark = pytest.mark.django_db
PASSWORD = "Correct-Horse-Battery-9"


def register(client: APIClient, **overrides: Any) -> Response:
    payload = {
        "email": "analyst@example.com",
        "password": PASSWORD,
        "first_name": "Trade",
        "last_name": "Analyst",
        **overrides,
    }
    return client.post(reverse("auth-register"), payload, format="json")


def test_registration_sets_http_only_token_cookies(api_client: APIClient) -> None:
    response = register(api_client)
    assert response.status_code == 201
    assert response.data["email"] == "analyst@example.com"
    assert response.cookies["access_token"]["httponly"] is True
    assert response.cookies["refresh_token"]["httponly"] is True
    assert User.objects.get().role == User.Role.USER


def test_invalid_password_uses_consistent_error_shape(api_client: APIClient) -> None:
    response = register(api_client, password="password")
    assert response.status_code == 400
    assert response.data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in response.data["error"]


def test_login_sets_tokens(api_client: APIClient) -> None:
    User.objects.create_user(email="analyst@example.com", password=PASSWORD)
    response = api_client.post(
        reverse("auth-login"),
        {"email": "analyst@example.com", "password": PASSWORD},
        format="json",
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_is_rate_limited(api_client: APIClient) -> None:
    cache.clear()
    for _ in range(5):
        response = api_client.post(
            reverse("auth-login"),
            {"email": "missing@example.com", "password": "wrong"},
            format="json",
        )
        assert response.status_code == 400
    limited = api_client.post(
        reverse("auth-login"),
        {"email": "missing@example.com", "password": "wrong"},
        format="json",
    )
    assert limited.status_code == 429


def test_refresh_rotates_refresh_token(api_client: APIClient) -> None:
    register_response = register(api_client)
    original = register_response.cookies["refresh_token"].value
    api_client.cookies["refresh_token"] = original
    response = api_client.post(reverse("auth-refresh"))
    assert response.status_code == 200
    assert response.cookies["refresh_token"].value != original


def test_logout_revokes_refresh_token(api_client: APIClient) -> None:
    register(api_client)
    refresh = api_client.cookies["refresh_token"].value
    response = api_client.post(reverse("auth-logout"))
    assert response.status_code == 204
    api_client.cookies["refresh_token"] = refresh
    revoked = api_client.post(reverse("auth-refresh"))
    assert revoked.status_code == 401


def test_me_requires_authentication(api_client: APIClient) -> None:
    response = api_client.get(reverse("auth-me"))
    assert response.status_code == 401


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_only(request: Request) -> Response:
    return Response({"status": "ok"})


def test_admin_role_permission() -> None:
    factory = APIRequestFactory()
    user = User.objects.create_user(email="user@example.com", password=PASSWORD)
    request = factory.get("/admin-only")
    force_authenticate(request, user=user)
    assert admin_only(request).status_code == 403

    admin = User.objects.create_user(
        email="admin@example.com", password=PASSWORD, role=User.Role.ADMIN
    )
    request = factory.get("/admin-only")
    force_authenticate(request, user=admin)
    assert admin_only(request).status_code == 200
