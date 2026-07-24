import pytest
from datasets.models import DatasetVersion, IngestionRun
from datasets.services import import_sample_dataset
from django.urls import reverse
from rest_framework.test import APIClient
from trade.models import AnnualTradeFlow

pytestmark = pytest.mark.django_db


def test_sample_import_is_idempotent_and_preserves_nulls() -> None:
    first = import_sample_dataset()
    second = import_sample_dataset()
    assert first.records_read == 40
    assert first.records_written == 40
    assert second.records_written == 0
    assert AnnualTradeFlow.objects.count() == 40
    missing = AnnualTradeFlow.objects.get(year=2020, hs6_code="010121")
    assert missing.quantity_tons is None
    assert missing.unit_value_usd_per_ton is None
    assert AnnualTradeFlow.objects.filter(hs6_code__startswith="0").exists()
    assert DatasetVersion.objects.get().status == DatasetVersion.Status.READY
    assert IngestionRun.objects.filter(status=IngestionRun.Status.SUCCEEDED).count() == 2


def test_trade_api_filters_and_returns_dataset_metadata(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.get(
        reverse("trade-timeseries"),
        {"exporter": "UZB", "product": "01", "start_year": "2020", "end_year": "2024"},
    )
    assert response.status_code == 200
    assert len(response.data["data"]) == 5
    assert response.data["meta"]["dataset_version"] == "sample-v1"
    assert response.data["meta"]["source_period_end"] == 2024


def test_data_freshness_marks_sample_as_synthetic(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.get(reverse("data-freshness"))
    assert response.status_code == 200
    assert response.data["data"]["synthetic"] is True
    assert response.data["data"]["row_count"] == 40
