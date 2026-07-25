from decimal import Decimal

import pytest
from accounts.models import User
from analytics.cache import analytics_cache_key
from analytics.calculations import cagr, exposure_components, growth, hhi
from analytics.services import anomaly_data
from datasets.services import import_sample_dataset
from django.urls import reverse
from rest_framework.test import APIClient
from trade.models import AnnualTradeFlow

pytestmark = pytest.mark.django_db


def test_growth_hhi_and_cagr_edge_cases() -> None:
    assert growth(120, 100) == pytest.approx(0.2)
    assert growth(120, 0) is None
    assert growth(120, None) is None
    assert cagr(100, 121, 2) == pytest.approx(0.1)
    assert cagr(0, 121, 2) is None
    assert cagr(100, 121, 0) is None
    assert hhi([50, 50]) == pytest.approx(0.5)
    assert 0 <= hhi([90, 10]) <= 1


def test_exposure_components_are_bounded_and_weighted() -> None:
    result = exposure_components(0.5, [100, 80], 2, [10, 20])
    assert set(result.as_dict()) == {
        "supplier_concentration",
        "trade_value_volatility",
        "negative_recent_trend",
        "low_supplier_count",
        "quantity_instability",
    }
    assert result.negative_recent_trend == pytest.approx(20)
    assert 0 <= result.score <= 100


def test_anomaly_detection_returns_transparent_features() -> None:
    import_sample_dataset()
    flow = AnnualTradeFlow.objects.order_by("-year").first()
    assert flow is not None
    flow.trade_value_usd = Decimal("999999999")
    flow.save(update_fields=["trade_value_usd"])
    anomalies = anomaly_data(AnnualTradeFlow.objects.all())
    assert len(anomalies) == 8
    assert all(
        {"year", "anomaly_score", "severity", "direction", "detected_features", "explanation"}
        <= item.keys()
        for item in anomalies
    )
    assert any(item["severity"] != "normal" for item in anomalies)


def test_map_is_aggregated_limited_and_versioned(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.get(reverse("trade-map"), {"top": 3})
    assert response.status_code == 200
    assert len(response.data["data"]) == 3
    assert response.data["meta"]["dataset_version"] == "sample-v1"
    assert "exporter" in response.data["data"][0]


def test_cache_key_includes_dataset_version_and_normalized_filters() -> None:
    first = analytics_cache_key("v1", "exposure", {"b": "2", "a": "1"}, "annual")
    reordered = analytics_cache_key("v1", "exposure", {"a": "1", "b": "2"}, "annual")
    next_version = analytics_cache_key("v2", "exposure", {"a": "1", "b": "2"}, "annual")
    assert first == reordered
    assert first != next_version


def test_saved_analysis_object_permissions(api_client: APIClient) -> None:
    first = User.objects.create_user(email="first@example.com", password="StrongPass123!")
    second = User.objects.create_user(email="second@example.com", password="StrongPass123!")
    api_client.force_authenticate(first)
    created = api_client.post(
        reverse("saved-analysis-list"),
        {
            "title": "Uzbek imports",
            "description": "",
            "filters": {"importer": "UZB"},
            "visualization": "map",
        },
        format="json",
    )
    assert created.status_code == 201
    analysis_id = created.data["id"]
    api_client.force_authenticate(second)
    assert api_client.get(reverse("saved-analysis-detail", args=[analysis_id])).status_code == 404
    assert (
        api_client.patch(
            reverse("saved-analysis-detail", args=[analysis_id]), {"title": "Nope"}, format="json"
        ).status_code
        == 404
    )
    assert (
        api_client.delete(reverse("saved-analysis-detail", args=[analysis_id])).status_code == 404
    )


def test_country_and_product_profiles(api_client: APIClient) -> None:
    import_sample_dataset()
    country = api_client.get(reverse("analytics-country-profile", args=["UZB"]))
    product = api_client.get(reverse("analytics-product-profile", args=["01"]))
    assert country.status_code == 200
    assert country.data["data"]["iso3"] == "UZB"
    assert country.data["data"]["total_imports_usd"] > 0
    assert 0 <= country.data["data"]["concentration"]["hhi"] <= 1
    assert product.status_code == 200
    assert product.data["data"]["hs2"] == "01"
    assert product.data["data"]["global_trend"]
