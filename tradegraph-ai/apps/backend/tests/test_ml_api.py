from pathlib import Path

import pytest
from datasets.models import DatasetVersion
from datasets.services import import_sample_dataset
from django.urls import reverse
from forecasting.models import ModelVersion
from forecasting.services import (
    activate_model,
    build_feature_frame,
    forecast,
    train_forecast_models,
)
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def model_record(dataset: DatasetVersion, version: str, status: str) -> ModelVersion:
    return ModelVersion.objects.create(
        model_name="test-model",
        model_version=version,
        task_type="trade_forecast",
        dataset_version=dataset,
        feature_schema_version="forecast-v1",
        training_period={"start": 2017, "end": 2021},
        validation_period={"start": 2022, "end": 2022},
        test_period={"start": 2023, "end": 2024},
        algorithm="ridge",
        hyperparameters={"random_seed": 42},
        metrics={"candidate": {"global": {"mae": 1}}},
        artifact_path=str(Path("missing.joblib")),
        checksum="0" * 64,
        status=status,
    )


def test_feature_generation_from_project_dataset() -> None:
    import_sample_dataset()
    frame = build_feature_frame()
    assert not frame.is_empty()
    assert {"trade_value_lag_1", "rolling_mean_3", "target"} <= set(frame.columns)
    assert frame["hs2"].str.len_chars().min() == 2


def test_training_serializes_candidate_and_retains_evaluation(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import_sample_dataset()
    monkeypatch.setattr("forecasting.services.ARTIFACT_ROOT", tmp_path)
    model = train_forecast_models()
    assert model.status in {ModelVersion.Status.ACTIVE, ModelVersion.Status.REJECTED}
    assert Path(model.artifact_path).exists()
    assert Path(model.artifact_path).with_suffix(".evaluation.json").exists()
    assert {"candidate", "baseline"} <= model.metrics.keys()


def test_model_activation_archives_previous_active() -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    previous = model_record(dataset, "v1", ModelVersion.Status.ACTIVE)
    candidate = model_record(dataset, "v2", ModelVersion.Status.CANDIDATE)
    activate_model(candidate)
    previous.refresh_from_db()
    candidate.refresh_from_db()
    assert previous.status == ModelVersion.Status.ARCHIVED
    assert candidate.status == ModelVersion.Status.ACTIVE


def test_missing_active_model_uses_compatible_baseline() -> None:
    import_sample_dataset()
    result = forecast({"importer": "CHN", "exporter": "UZB", "hs2": "01", "year": 2025})
    assert result["model_name"] == "three_year_moving_average"
    assert result["forecast"]["value"] == result["baseline_forecast"]
    assert result["historical_values"]


def test_forecast_request_can_be_retrieved(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.post(
        reverse("ml-forecast"),
        {"importer": "CHN", "exporter": "UZB", "hs2": "01", "year": 2025},
        format="json",
    )
    assert response.status_code == 200
    retrieved = api_client.get(reverse("ml-forecast-result", args=[response.data["request_id"]]))
    assert retrieved.status_code == 200
    assert retrieved.data["dataset_version"] == "sample-v1"


def test_supplier_recommendations_are_transparent(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.post(
        reverse("ml-supplier-recommendations"),
        {"importer": "USA", "hs2": "01", "year": 2024},
        format="json",
    )
    assert response.status_code == 200
    assert "not a trained ML model" in response.data["methodology"]
    assert response.data["candidates"]
    assert response.data["candidates"][0]["country"] != "USA"


def test_rule_and_ml_anomaly_scores_are_returned(api_client: APIClient) -> None:
    import_sample_dataset()
    response = api_client.get(reverse("analytics-anomalies"))
    assert response.status_code == 200
    assert {"rule_based_score", "ml_anomaly_score"} <= response.data["data"][0].keys()
