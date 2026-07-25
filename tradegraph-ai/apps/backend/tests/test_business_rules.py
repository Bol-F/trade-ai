from decimal import Decimal
from typing import Any

import pytest
from analytics.calculations import cagr, exposure_components, growth, hhi
from analytics.services import concentration_data, exposure_data
from audit.models import AuditEvent
from datasets.lifecycle import InvalidDatasetTransition, transition_dataset
from datasets.models import DatasetVersion
from datasets.services import activate_dataset, import_sample_dataset
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient
from trade.models import AnnualTradeFlow

pytestmark = pytest.mark.django_db


def test_growth_and_cagr_complete_edge_case_matrix() -> None:
    assert growth(None, 10) is None
    assert growth(10, None) is None
    assert growth(10, 0) is None
    assert growth(0, 10) == -1
    assert growth(10, 10) == 0
    assert cagr(None, 10, 2) is None
    assert cagr(10, None, 2) is None
    assert cagr(0, 10, 2) is None
    assert cagr(10, -1, 2) is None
    assert cagr(10, 20, 0) is None
    assert cagr(10, 0, 2) == -1


@pytest.mark.parametrize(
    ("values", "expected"),
    [
        ([100], 1.0),
        ([50, 50], 0.5),
        ([25, 25, 25, 25], 0.25),
        ([100, 0], 1.0),
        ([], 0.0),
    ],
)
def test_hhi_golden_cases(values: list[float], expected: float) -> None:
    assert hhi(values) == pytest.approx(expected)


def test_hhi_and_exposure_property_bounds() -> None:
    for supplier_count in range(1, 25):
        values = [float(index + 1) for index in range(supplier_count)]
        score = hhi(values)
        assert 0 <= score <= 1
        components = exposure_components(
            score,
            [100, 90, 110],
            supplier_count,
            [None, float(supplier_count), float(supplier_count + 1)],
        )
        assert all(0 <= value <= 100 for value in components.as_dict().values())
        assert 0 <= components.score <= 100


def test_missing_quantity_is_reported_without_maximum_risk() -> None:
    components = exposure_components(0.5, [100, 80], 2, [None, None])
    assert components.quantity_instability == 0
    assert components.quantity_data_available is False
    assert "Unavailable" in components.explanations()["quantity_instability"]
    assert components.score == pytest.approx(29.28)


def test_supplier_population_excludes_zero_and_shares_sum_to_one() -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    flow = AnnualTradeFlow.objects.filter(dataset_version=dataset).first()
    assert flow is not None
    flow.pk = None
    flow.exporter_id = flow.importer_id
    flow.trade_value_usd = Decimal("0")
    flow.quantity_tons = None
    flow.unit_value_usd_per_ton = None
    flow.save()
    result = concentration_data(
        AnnualTradeFlow.objects.filter(
            dataset_version=dataset,
            importer=flow.importer,
            hs2_code=flow.hs2_code,
            year=flow.year,
        )
    )
    assert result["supplier_count"] == len(result["suppliers"])
    assert sum(item["share"] for item in result["suppliers"]) == pytest.approx(1, abs=1e-5)
    assert all(item["trade_value_usd"] > 0 for item in result["suppliers"])


def test_exposure_reports_insufficient_history() -> None:
    import_sample_dataset()
    flow = AnnualTradeFlow.objects.filter(year=2024).first()
    assert flow is not None
    result = exposure_data(AnnualTradeFlow.objects.filter(pk=flow.pk))
    assert result["insufficient_history"] is True
    assert result["quantity_data_available"] is False


@pytest.mark.parametrize(
    ("params", "field"),
    [
        ({"importer": "US"}, "importer"),
        ({"exporter": "123"}, "exporter"),
        ({"product": "1"}, "product"),
        ({"product": "01A1"}, "product"),
        ({"direction": "imports"}, "direction"),
        ({"direction": "sideways", "importer": "USA"}, "direction"),
        ({"aggregation_level": "monthly"}, "aggregation_level"),
        ({"dataset_version": "archived-v1"}, "dataset_version"),
    ],
)
def test_invalid_filter_combinations_are_stable(
    api_client: APIClient, params: dict[str, str], field: str
) -> None:
    import_sample_dataset()
    response = api_client.get(reverse("trade-timeseries"), params)
    assert response.status_code == 400
    assert response.data["error"]["code"] == "VALIDATION_ERROR"
    assert field in response.data["error"]["details"]


def test_filter_orientation_and_empty_coverage(api_client: APIClient) -> None:
    import_sample_dataset()
    lane = AnnualTradeFlow.objects.first()
    assert lane is not None
    both = api_client.get(
        reverse("trade-timeseries"),
        {
            "importer": lane.importer.iso3,
            "exporter": lane.exporter.iso3,
            "start_year": str(lane.year),
            "end_year": str(lane.year),
        },
    )
    assert both.status_code == 200
    assert len(both.data["data"]) == 1
    outside = api_client.get(
        reverse("trade-timeseries"), {"start_year": 2025, "end_year": 2025}
    )
    assert outside.status_code == 200
    assert outside.data["data"] == []


def test_dataset_transition_graph_rejects_shortcuts() -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    dataset.status = DatasetVersion.Status.FAILED
    dataset.is_active = False
    dataset.save(update_fields=["status", "is_active"])
    with pytest.raises(InvalidDatasetTransition, match="failed to ready"):
        transition_dataset(dataset, DatasetVersion.Status.READY)
    transition_dataset(dataset, DatasetVersion.Status.VALIDATING)
    transition_dataset(dataset, DatasetVersion.Status.PROCESSING)
    transition_dataset(dataset, DatasetVersion.Status.READY)


def test_activation_validates_data_clears_cache_and_audits(
    django_capture_on_commit_callbacks: Any,
) -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    cache.set("business-rule-test", "stale")
    with django_capture_on_commit_callbacks(execute=True):
        activate_dataset(dataset)
    assert cache.get("business-rule-test") is None
    assert AuditEvent.objects.filter(
        action="dataset_activated", metadata__dataset_version=dataset.version
    ).exists()


def test_forecast_without_lane_history_returns_422(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.post(
        reverse("ml-forecast"),
        {"importer": "USA", "exporter": "USA", "hs2": "99", "year": 2025},
        format="json",
    )
    assert response.status_code == 422
    assert response.data["error"]["code"] == "INSUFFICIENT_ANALYTICAL_DATA"
