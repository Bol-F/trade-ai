import pytest
from accounts.models import User
from audit.models import AuditEvent
from audit.utils import safe_csv_cell
from datasets.services import import_sample_dataset
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_metrics_endpoint_is_prometheus_text(api_client: APIClient) -> None:
    response = api_client.get(reverse("metrics"))
    assert response.status_code == 200
    assert b"tradegraph_http_requests_total" in response.content


def test_data_health_requires_admin_role(api_client: APIClient) -> None:
    user = User.objects.create_user(email="user@example.com", password="StrongPass123!")
    api_client.force_authenticate(user)
    assert api_client.get(reverse("admin-data-health")).status_code == 403
    user.role = User.Role.ADMIN
    user.save(update_fields=["role"])
    import_sample_dataset()
    response = api_client.get(reverse("admin-data-health"))
    assert response.status_code == 200
    assert response.data["active_dataset"]["version"] == "sample-v1"
    assert response.data["cache_status"] == "ok"


def test_authenticated_mutations_create_sanitized_audit_event(api_client: APIClient) -> None:
    user = User.objects.create_user(email="audit@example.com", password="StrongPass123!")
    api_client.force_authenticate(user)
    response = api_client.post(
        reverse("saved-analysis-list"),
        {
            "title": "Audit me",
            "description": "not copied to audit metadata",
            "filters": {},
            "visualization": "map",
        },
        format="json",
    )
    assert response.status_code == 201
    event = AuditEvent.objects.get()
    assert event.user == user
    assert event.metadata == {}
    assert event.request_id


@pytest.mark.parametrize("value", ["=SUM(A1:A2)", "+cmd", "-1+2", "@formula", "\tdata"])
def test_csv_formula_injection_is_neutralized(value: str) -> None:
    assert safe_csv_cell(value).startswith("'")
