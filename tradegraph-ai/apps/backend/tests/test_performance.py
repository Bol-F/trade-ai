import time
from pathlib import Path

import polars as pl
import pytest
from accounts.models import User
from analytics.models import SavedAnalysis
from catalog.models import Country, Product
from datasets.models import DatasetVersion
from datasets.services import import_sample_dataset
from django.core.cache import cache
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from forecasting.models import ModelVersion
from rest_framework.test import APIClient
from tradegraph_data_pipeline.extract.streaming import scan_baci_csv

pytestmark = pytest.mark.django_db


def test_lazy_year_partition_handles_generated_large_sample(tmp_path: Path) -> None:
    rows = 100_000
    path = tmp_path / "generated-baci.csv"
    pl.DataFrame(
        {
            "t": [2020 + index % 5 for index in range(rows)],
            "i": ["860"] * rows,
            "j": ["156"] * rows,
            "k": ["010121"] * rows,
            "v": [100.0] * rows,
            "q": [10.0] * rows,
        }
    ).write_csv(path)
    started = time.perf_counter()
    lazy = scan_baci_csv(path)
    partition = lazy.filter(pl.col("t") == 2024).collect(engine="streaming")
    assert partition.height == 20_000
    assert time.perf_counter() - started < 10


def test_analytics_query_count_and_top_n_payload_are_bounded(api_client: APIClient) -> None:
    import_sample_dataset()
    with CaptureQueriesContext(connection) as queries:
        response = api_client.get(reverse("trade-map"), {"top": 3})
    assert response.status_code == 200
    assert len(response.data["data"]) <= 3
    assert len(queries) <= 6


def query_count(client: APIClient, url: str, data: dict[str, str | int] | None = None) -> int:
    with CaptureQueriesContext(connection) as queries:
        response = client.get(url, data or {})
    assert response.status_code == 200
    return len(queries)


def test_country_and_product_list_query_counts_stay_constant(api_client: APIClient) -> None:
    import_sample_dataset()
    country_url = reverse("country-list")
    product_url = reverse("product-list")
    baseline = (query_count(api_client, country_url), query_count(api_client, product_url))
    first_product = Product.objects.first()
    assert first_product is not None
    classification = first_product.classification
    Country.objects.bulk_create(
        [
            Country(
                baci_code=f"9{index:03}",
                m49_code=f"{700 + index:03}",
                iso2=f"Q{chr(65 + index)}",
                iso3=f"Q{chr(65 + index)}X",
                name=f"Generated {index}",
            )
            for index in range(10)
        ]
    )
    Product.objects.bulk_create(
        [
            Product(
                classification=classification,
                code=f"8{index:05}",
                level=Product.Level.HS6,
                name=f"Generated product {index}",
            )
            for index in range(30)
        ]
    )
    assert (query_count(api_client, country_url), query_count(api_client, product_url)) == baseline


def test_saved_analysis_list_query_count_stays_constant(api_client: APIClient) -> None:
    owner = User.objects.create_user("performance@example.com", "safe-test-password")
    api_client.force_authenticate(owner)
    url = reverse("saved-analysis-list")
    SavedAnalysis.objects.create(
        owner=owner,
        title="Baseline",
        visualization=SavedAnalysis.Visualization.EXPLORER,
    )
    baseline = query_count(api_client, url)
    SavedAnalysis.objects.bulk_create(
        [
            SavedAnalysis(
                owner=owner,
                title=f"Analysis {index}",
                visualization=SavedAnalysis.Visualization.EXPLORER,
            )
            for index in range(39)
        ]
    )
    assert query_count(api_client, url) == baseline


def test_admin_health_and_active_models_have_bounded_queries(api_client: APIClient) -> None:
    import_sample_dataset()
    admin = User.objects.create_user(
        "admin-performance@example.com", "safe-test-password", role=User.Role.ADMIN
    )
    api_client.force_authenticate(admin)
    health_count = query_count(api_client, reverse("admin-data-health"))
    dataset = DatasetVersion.objects.get()
    ModelVersion.objects.bulk_create(
        [
            ModelVersion(
                model_name=f"perf-{index}",
                model_version="v1",
                task_type=f"perf-task-{index}",
                dataset_version=dataset,
                feature_schema_version="v1",
                algorithm="ridge",
                artifact_path="unused",
                checksum="0" * 64,
                status=ModelVersion.Status.ACTIVE,
            )
            for index in range(10)
        ]
    )
    assert query_count(api_client, reverse("admin-data-health")) == health_count
    assert query_count(api_client, reverse("ml-active-models")) <= 2


def test_supplier_and_country_profile_query_counts_are_bounded(api_client: APIClient) -> None:
    import_sample_dataset()
    with CaptureQueriesContext(connection) as supplier_queries:
        response = api_client.post(
            reverse("ml-supplier-recommendations"),
            {"importer": "USA", "hs2": "01", "year": 2024},
            format="json",
        )
    assert response.status_code == 200
    assert len(supplier_queries) <= 4
    # Clear the profile cache so this measures the calculation path.
    cache.clear()
    assert query_count(api_client, reverse("analytics-country-profile", args=["UZB"])) <= 7


def test_expensive_date_ranges_are_rejected(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.get(reverse("trade-timeseries"), {"start_year": 1900, "end_year": 2024})
    assert response.status_code == 400
    assert b"50 years" in response.content


def test_map_payload_is_top_n_aggregated(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.get(reverse("trade-map"), {"top": 2})
    assert response.status_code == 200
    assert len(response.data["data"]) <= 2
    assert len(response.content) < 2_500
    assert b"hs6_code" not in response.content
    compressed = api_client.get(reverse("trade-map"), {"top": 25}, HTTP_ACCEPT_ENCODING="gzip")
    assert compressed.headers["Content-Encoding"] == "gzip"
