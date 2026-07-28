import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_language_api_uses_accept_language_and_lists_supported_locales(client):
    response = client.get(reverse("language-preference"), HTTP_ACCEPT_LANGUAGE="ru")

    assert response.status_code == 200
    assert response.json() == {
        "language": "ru",
        "language_name": "Русский",
        "available_languages": [
            {"code": "en", "name": "English"},
            {"code": "ru", "name": "Русский"},
        ],
    }


@pytest.mark.django_db
def test_language_api_persists_supported_locale_in_django_cookie(client):
    response = client.post(
        reverse("language-preference"),
        {"language": "ru"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.cookies["django_language"].value == "ru"
    assert response.json()["language_name"] == "Русский"


@pytest.mark.django_db
def test_language_api_rejects_unsupported_locale(client):
    response = client.post(
        reverse("language-preference"),
        {"language": "de"},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSUPPORTED_LANGUAGE"


@pytest.mark.django_db
def test_admin_login_uses_russian_django_translation(client):
    client.cookies["django_language"] = "ru"
    response = client.get(reverse("admin:login"))

    assert response.status_code == 200
    assert "Войти" in response.content.decode("utf-8")
    assert 'id="admin-language"' in response.content.decode("utf-8")
