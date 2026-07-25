import zipfile
from pathlib import Path

import pytest
from accounts.models import User
from datasets.clients import _validate_external_url
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from tradegraph_data_pipeline.extract.streaming import materialized_csv, validate_download_url

pytestmark = pytest.mark.django_db
PASSWORD = "Correct-Horse-Battery-9"


def csrf_client() -> tuple[APIClient, str]:
    client = APIClient(enforce_csrf_checks=True)
    response = client.get(reverse("auth-csrf"))
    assert response.status_code == 200
    return client, response.cookies["csrftoken"].value


def test_login_and_registration_require_csrf_bootstrap() -> None:
    client = APIClient(enforce_csrf_checks=True)
    payload = {
        "email": "csrf@example.com",
        "password": PASSWORD,
        "first_name": "CSRF",
        "last_name": "Test",
    }
    assert client.post(reverse("auth-register"), payload, format="json").status_code == 403
    client, token = csrf_client()
    response = client.post(reverse("auth-register"), payload, format="json", HTTP_X_CSRFTOKEN=token)
    assert response.status_code == 201


def test_cookie_mutation_requires_csrf_but_bearer_token_does_not() -> None:
    user = User.objects.create_user(email="bearer@example.com", password=PASSWORD)
    cookie_client = APIClient(enforce_csrf_checks=True)
    cookie_client.cookies["access_token"] = str(RefreshToken.for_user(user).access_token)
    payload = {"title": "Protected", "description": "", "filters": {}, "visualization": "explorer"}
    assert (
        cookie_client.post(reverse("saved-analysis-list"), payload, format="json").status_code
        == 403
    )

    bearer_client = APIClient(enforce_csrf_checks=True)
    response = bearer_client.post(
        reverse("saved-analysis-list"),
        payload,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}",
    )
    assert response.status_code == 201


def test_auth_cookies_are_http_only_securely_scoped() -> None:
    client, token = csrf_client()
    response = client.post(
        reverse("auth-register"),
        {
            "email": "paths@example.com",
            "password": PASSWORD,
            "first_name": "Cookie",
            "last_name": "Paths",
        },
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert response.cookies["access_token"]["path"] == "/api/v1"
    assert response.cookies["refresh_token"]["path"] == "/api/v1/auth"
    assert response.cookies["access_token"]["httponly"]
    assert response.cookies["refresh_token"]["httponly"]


@override_settings(METRICS_ALLOW_UNAUTHENTICATED=False, METRICS_BEARER_TOKEN="metrics-secret")
def test_metrics_require_constant_time_bearer_secret() -> None:
    client = APIClient()
    assert client.get(reverse("metrics")).status_code == 404
    assert client.get(reverse("metrics"), HTTP_AUTHORIZATION="Bearer wrong").status_code == 404
    assert (
        client.get(reverse("metrics"), HTTP_AUTHORIZATION="Bearer metrics-secret").status_code
        == 200
    )


@pytest.mark.parametrize(
    "url",
    [
        "http://www.cepii.fr/baci.zip",
        "https://localhost/baci.zip",
        "https://127.0.0.1/baci.zip",
        "https://user:pass@www.cepii.fr/baci.zip",
        "file:///etc/passwd",
    ],
)
def test_baci_download_rejects_ssrf_and_credential_urls(url: str) -> None:
    with pytest.raises(ValueError):
        validate_download_url(url)


def test_external_api_url_rejects_non_allowlisted_hosts() -> None:
    with pytest.raises(ValueError):
        _validate_external_url("https://169.254.169.254/latest/meta-data")
    with pytest.raises(ValueError):
        _validate_external_url("http://api.worldbank.org/v2/country")
    _validate_external_url("https://api.worldbank.org/v2/country/UZB")


def test_zip_bomb_ratio_is_rejected(tmp_path: Path) -> None:
    archive_path = tmp_path / "baci.zip"
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("baci.csv", b"0" * (2 * 1024 * 1024))
    with pytest.raises(ValueError, match="compression ratio"):
        with materialized_csv(str(archive_path)):
            pass
