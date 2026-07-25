from datetime import timedelta

import pytest
from accounts.models import User
from analytics.exports import safe_csv_cell
from analytics.models import AnalysisExport, Favorite, SavedAnalysis, SavedComparison, WatchlistItem
from django.utils import timezone
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db
PASSWORD = "StrongPass123!"


def authenticated(email: str) -> tuple[APIClient, User]:
    user = User.objects.create_user(email=email, password=PASSWORD)
    client = APIClient()
    client.force_authenticate(user)
    return client, user


def analysis(owner: User, title: str) -> SavedAnalysis:
    return SavedAnalysis.objects.create(
        owner=owner, title=title, visualization="explorer", filters={"importer": "UZB"}
    )


def test_workspace_returns_only_the_authenticated_owners_items() -> None:
    first_client, first = authenticated("workspace-first@example.com")
    _, second = authenticated("workspace-second@example.com")
    analysis(first, "Mine")
    analysis(second, "Not mine")
    Favorite.objects.create(owner=first, kind="country", code="UZB", label="Uzbekistan")
    Favorite.objects.create(owner=second, kind="country", code="DEU", label="Germany")
    WatchlistItem.objects.create(
        owner=first, name="Mine", importer="UZB", product="01", start_year=2020, end_year=2024
    )
    WatchlistItem.objects.create(
        owner=second, name="Not mine", importer="DEU", product="01", start_year=2020, end_year=2024
    )

    response = first_client.get("/api/v1/workspace")
    assert response.status_code == 200
    assert [item["title"] for item in response.data["saved_analyses"]] == ["Mine"]
    assert [item["label"] for item in response.data["favorites"]] == ["Uzbekistan"]
    assert [item["name"] for item in response.data["watchlist_items"]] == ["Mine"]


@pytest.mark.parametrize(
    "endpoint,model,payload",
    [
        (
            "/api/v1/watchlists",
            WatchlistItem,
            {
                "name": "Lane",
                "importer": "UZB",
                "exporter": "",
                "product": "01",
                "start_year": 2020,
                "end_year": 2024,
            },
        ),
        ("/api/v1/favorites", Favorite, {"kind": "country", "code": "UZB", "label": "Uzbekistan"}),
        (
            "/api/v1/saved-comparisons",
            SavedComparison,
            {
                "name": "Markets",
                "countries": ["UZB", "DEU"],
                "suppliers": [],
                "product": "01",
                "start_year": 2020,
                "end_year": 2024,
            },
        ),
    ],
)
def test_workspace_object_detail_is_owner_scoped(
    endpoint: str, model: type, payload: dict[str, object]
) -> None:
    first_client, _ = authenticated(f"first-{model.__name__}@example.com")
    second_client, _ = authenticated(f"second-{model.__name__}@example.com")
    created = first_client.post(endpoint, payload, format="json")
    assert created.status_code == 201
    assert second_client.get(f"{endpoint}/{created.data['id']}").status_code == 404
    assert (
        second_client.patch(
            f"{endpoint}/{created.data['id']}", {"name": "stolen"}, format="json"
        ).status_code
        == 404
    )
    assert second_client.delete(f"{endpoint}/{created.data['id']}").status_code == 404


def test_export_rejects_another_users_analysis_and_download() -> None:
    first_client, first = authenticated("export-first@example.com")
    second_client, second = authenticated("export-second@example.com")
    mine = analysis(first, "=Formula title")
    other = analysis(second, "Other")
    assert first_client.post(
        "/api/v1/exports", {"analysis": other.id, "format": "csv"}, format="json"
    ).status_code in {400, 403}
    created = first_client.post(
        "/api/v1/exports", {"analysis": mine.id, "format": "csv"}, format="json"
    )
    assert created.status_code == 201
    assert second_client.get(f"/api/v1/exports/{created.data['id']}/download").status_code == 404
    content = first_client.get(f"/api/v1/exports/{created.data['id']}/download").content.decode()
    assert "'=Formula title" in content


def test_expired_export_cannot_be_downloaded() -> None:
    client, owner = authenticated("expired@example.com")
    item = AnalysisExport.objects.create(
        owner=owner,
        analysis=analysis(owner, "Old"),
        format="json",
        status="ready",
        content="{}",
        expires_at=timezone.now() - timedelta(seconds=1),
    )
    assert client.get(f"/api/v1/exports/{item.id}/download").status_code == 410


@pytest.mark.parametrize("value", ["=1+1", "+cmd", "-2+3", "@SUM(A1)", "\tformula", "\rformula"])
def test_csv_formula_injection_is_neutralized(value: str) -> None:
    assert safe_csv_cell(value).startswith("'")
