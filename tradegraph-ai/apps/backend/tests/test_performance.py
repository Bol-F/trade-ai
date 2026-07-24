import time
from pathlib import Path

import polars as pl
import pytest
from datasets.services import import_sample_dataset
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
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
