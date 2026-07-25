import hashlib
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
    rollback_model,
    train_forecast_models,
)
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def model_record(
    dataset: DatasetVersion,
    version: str,
    status: str,
    artifact_path: Path | None = None,
) -> ModelVersion:
    path = artifact_path or Path("missing.joblib")
    checksum = hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else "0" * 64
    if path.is_file():
        path.with_suffix(".evaluation.json").write_text("{}", encoding="utf-8")
    return ModelVersion.objects.create(
        model_name="test-model",
        model_version=version,
        task_type="trade_forecast",
        dataset_version=dataset,
        feature_schema_version="forecast-v2",
        training_period={"start": 2017, "end": 2021},
        validation_period={"start": 2022, "end": 2022},
        test_period={"start": 2023, "end": 2024},
        algorithm="ridge",
        hyperparameters={"random_seed": 42},
        metrics={
            "feature_validation": {"passed": True},
            "candidate": {"global": {"mae": 1}},
            "baseline": {"global": {"mae": 2}},
            "activation_checks": {
                "segment_guardrail_passed": True,
                "inference_compatibility_passed": True,
                "reproducibility_passed": True,
                "administratively_approved": False,
            },
        },
        artifact_path=str(path),
        checksum=checksum,
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
    assert model.status in {ModelVersion.Status.CANDIDATE, ModelVersion.Status.REJECTED}
    assert Path(model.artifact_path).exists()
    assert Path(model.artifact_path).with_suffix(".evaluation.json").exists()
    assert {"candidate", "baseline"} <= model.metrics.keys()


def test_model_activation_archives_previous_active(tmp_path: Path) -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    previous = model_record(dataset, "v1", ModelVersion.Status.ACTIVE)
    artifact = tmp_path / "candidate.joblib"
    artifact.write_bytes(b"verified model artifact")
    candidate = model_record(dataset, "v2", ModelVersion.Status.CANDIDATE, artifact)
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
    assert result["forecast"]["lower_bound"] <= result["forecast"]["value"]
    assert result["forecast"]["upper_bound"] >= result["forecast"]["value"]
    assert result["lineage"]["feature_schema_version"] == "forecast-v2"
    assert result["used_fallback"] is True


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


def test_model_activation_requires_metrics_and_verified_artifact(tmp_path: Path) -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    artifact = tmp_path / "candidate.joblib"
    artifact.write_bytes(b"candidate")
    candidate = model_record(dataset, "invalid-metrics", ModelVersion.Status.CANDIDATE, artifact)
    candidate.metrics = {}
    candidate.save(update_fields=["metrics"])
    with pytest.raises(ValueError, match="metrics"):
        activate_model(candidate)
    candidate.metrics = {
        "feature_validation": {"passed": True},
        "candidate": {"global": {"mae": 1}},
        "baseline": {"global": {"mae": 2}},
        "activation_checks": {
            "segment_guardrail_passed": True,
            "inference_compatibility_passed": True,
            "reproducibility_passed": True,
            "administratively_approved": False,
        },
    }
    candidate.checksum = ""
    candidate.save(update_fields=["metrics", "checksum"])
    with pytest.raises(ValueError, match="checksummed"):
        activate_model(candidate)


def test_missing_active_artifact_returns_controlled_503(api_client: APIClient) -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    model_record(dataset, "missing-active", ModelVersion.Status.ACTIVE)
    response = api_client.post(
        reverse("ml-forecast"),
        {"importer": "CHN", "exporter": "UZB", "hs2": "01", "year": 2025},
        format="json",
    )
    assert response.status_code == 503
    assert response.data["error"]["code"] == "MODEL_ARTIFACT_UNAVAILABLE"


def test_competing_model_activations_leave_exactly_one_active(tmp_path: Path) -> None:
    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    first_path = tmp_path / "first.joblib"
    second_path = tmp_path / "second.joblib"
    first_path.write_bytes(b"first")
    second_path.write_bytes(b"second")
    first = model_record(dataset, "candidate-1", ModelVersion.Status.CANDIDATE, first_path)
    second = model_record(dataset, "candidate-2", ModelVersion.Status.CANDIDATE, second_path)
    activate_model(first)
    activate_model(second)
    assert (
        ModelVersion.objects.filter(
            task_type="trade_forecast", status=ModelVersion.Status.ACTIVE
        ).count()
        == 1
    )
    first.refresh_from_db()
    second.refresh_from_db()
    assert first.status == ModelVersion.Status.ARCHIVED
    assert second.status == ModelVersion.Status.ACTIVE


def test_model_rollback_restores_previous_active_and_audits(tmp_path: Path) -> None:
    from audit.models import AuditEvent

    import_sample_dataset()
    dataset = DatasetVersion.objects.get()
    old_path = tmp_path / "old.joblib"
    new_path = tmp_path / "new.joblib"
    old_path.write_bytes(b"old")
    new_path.write_bytes(b"new")
    old = model_record(dataset, "rollback-old", ModelVersion.Status.ACTIVE, old_path)
    new = model_record(dataset, "rollback-new", ModelVersion.Status.CANDIDATE, new_path)
    activate_model(new)
    restored = rollback_model()
    assert restored.pk == old.pk
    assert AuditEvent.objects.filter(action="model.rolled_back").exists()
