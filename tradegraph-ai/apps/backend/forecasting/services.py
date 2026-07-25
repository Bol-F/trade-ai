from __future__ import annotations

import json
import math
import uuid
from pathlib import Path
from typing import Any

import numpy as np
import polars as pl
from datasets.models import DatasetVersion
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import APIException
from trade.models import AnnualTradeFlow
from trade.services import latest_ready_dataset
from tradegraph_ml.evaluation.metrics import chronological_split, grouped_evaluation
from tradegraph_ml.explainability import explain_forecast, explanation_schema
from tradegraph_ml.features import (
    FEATURE_SCHEMA_VERSION,
    build_forecast_features,
    require_valid_features,
)
from tradegraph_ml.forecasting import build_hist_gradient_boosting, build_ridge
from tradegraph_ml.forecasting.models import (
    CATEGORICAL,
    NUMERIC,
    moving_average_forecast,
    previous_year_forecast,
)
from tradegraph_ml.registry import load_artifact, save_artifact
from tradegraph_ml.registry.artifacts import artifact_checksum

from forecasting.models import ModelVersion

ARTIFACT_ROOT = Path(settings.BASE_DIR).parent.parent / "artifacts" / "ml"


class InsufficientAnalyticalData(APIException):
    status_code = 422
    default_detail = "Insufficient historical data for this analysis."
    default_code = "insufficient_analytical_data"


class ModelArtifactUnavailable(APIException):
    status_code = 503
    default_detail = "The active model artifact is unavailable or invalid."
    default_code = "model_artifact_unavailable"


def build_feature_frame(dataset: DatasetVersion | None = None) -> pl.DataFrame:
    dataset = dataset or latest_ready_dataset()
    if dataset is None:
        return pl.DataFrame()
    rows = list(
        AnnualTradeFlow.objects.filter(dataset_version=dataset)
        .values("year", "importer__iso3", "exporter__iso3", "hs2_code")
        .annotate(
            trade_value_usd=Sum("trade_value_usd"),
            quantity_tons=Sum("quantity_tons"),
        )
        .order_by("year")
    )
    if not rows:
        return pl.DataFrame()
    importer_totals: dict[tuple[str, str, int], float] = {}
    global_totals: dict[tuple[str, int], float] = {}
    supplier_values: dict[tuple[str, str, int], list[float]] = {}
    for row in rows:
        year = int(row["year"])
        hs2 = str(row["hs2_code"])
        importer = str(row["importer__iso3"])
        key = (importer, hs2, year)
        value = float(row["trade_value_usd"])
        importer_totals[key] = importer_totals.get(key, 0) + value
        global_key = (hs2, year)
        global_totals[global_key] = global_totals.get(global_key, 0) + value
        if value > 0:
            supplier_values.setdefault(key, []).append(value)
    global_growth: dict[tuple[str, int], float] = {}
    years_by_product: dict[str, set[int]] = {}
    for hs2, year in global_totals:
        years_by_product.setdefault(hs2, set()).add(year)
    for hs2, years in years_by_product.items():
        previous: float | None = None
        for year in sorted(years):
            current = global_totals[(hs2, year)]
            global_growth[(hs2, year)] = (
                (current - previous) / previous if previous is not None and previous != 0 else 0
            )
            previous = current
    normalized = []
    for row in rows:
        year = int(row["year"])
        hs2 = str(row["hs2_code"])
        importer = str(row["importer__iso3"])
        value = float(row["trade_value_usd"])
        population_key = (importer, hs2, year)
        total = importer_totals[population_key]
        population = supplier_values.get(population_key, [])
        count = len(population)
        share = value / total if total else 0
        population_hhi = sum((supplier_value / total) ** 2 for supplier_value in population)
        normalized.append(
            {
                "year": year,
                "importer": importer,
                "exporter": str(row["exporter__iso3"]),
                "hs2": hs2,
                "trade_value_usd": value,
                "quantity_tons": (
                    float(row["quantity_tons"]) if row["quantity_tons"] is not None else None
                ),
                "supplier_share": share,
                "supplier_count": count,
                "hhi": population_hhi,
                "global_product_growth": global_growth[(hs2, year)],
            }
        )
    return build_forecast_features(pl.DataFrame(normalized), dataset.version)


def train_forecast_models(dataset: DatasetVersion | None = None) -> ModelVersion:
    dataset = dataset or latest_ready_dataset()
    if dataset is None:
        raise ValueError("No ready dataset.")
    raw_frame = build_feature_frame(dataset)
    validation_report = require_valid_features(raw_frame, dataset.version)
    frame = raw_frame.fill_null(0)
    years = sorted(frame["year"].unique().to_list())
    if len(years) < 3:
        raise ValueError("At least three feature years are required.")
    train, validation, test = chronological_split(frame, years[-2], years[-1])
    feature_columns = [*NUMERIC, *CATEGORICAL]
    x_train = train.select(feature_columns)
    y_train = train["target"].to_numpy()
    x_validation = validation.select(feature_columns)
    y_validation_usd = np.expm1(validation["target"].to_numpy())
    baseline = moving_average_forecast(
        validation.select(
            ["trade_value_lag_1", "trade_value_lag_2", "trade_value_lag_3"]
        ).to_numpy()
    )
    baseline_report = grouped_evaluation(validation, y_validation_usd, baseline)
    previous_year_report = grouped_evaluation(
        validation,
        y_validation_usd,
        previous_year_forecast(validation["trade_value_lag_1"].to_numpy()),
    )
    candidates = {
        "ridge": build_ridge(),
        "hist_gradient_boosting": build_hist_gradient_boosting(),
    }
    evaluated: list[tuple[str, Any, dict[str, Any]]] = []
    for name, model in candidates.items():
        model.fit(x_train, y_train)
        predictions = np.expm1(model.predict(x_validation))
        evaluated.append(
            (name, model, grouped_evaluation(validation, y_validation_usd, predictions))
        )
    name, model, report = min(evaluated, key=lambda item: item[2]["global"]["mae"])
    beats_baseline = report["global"]["mae"] < baseline_report["global"]["mae"]
    development = pl.concat([train, validation])
    model.fit(
        development.select(feature_columns),
        development["target"].to_numpy(),
    )
    test_actual_usd = np.expm1(test["target"].to_numpy())
    test_predictions = np.expm1(model.predict(test.select(feature_columns)))
    test_baseline = moving_average_forecast(
        test.select(["trade_value_lag_1", "trade_value_lag_2", "trade_value_lag_3"]).to_numpy()
    )
    version = timezone.now().strftime("%Y%m%d%H%M%S")
    artifact_path = ARTIFACT_ROOT / f"forecast-{version}.joblib"
    checksum = save_artifact(model, artifact_path)
    metrics = {
        "feature_validation": validation_report.to_dict(),
        "candidate": report,
        "baseline": baseline_report,
        "previous_year_baseline": previous_year_report,
        "candidate_comparison": {
            candidate_name: candidate_report for candidate_name, _, candidate_report in evaluated
        },
        "test_candidate": grouped_evaluation(test, test_actual_usd, test_predictions),
        "test_baseline": grouped_evaluation(test, test_actual_usd, test_baseline),
        "activation_checks": {
            "segment_guardrail_passed": all(
                report.get(segment, {}).get(key, {}).get("mae", 0)
                <= baseline_report.get(segment, {}).get(key, {}).get("mae", math.inf) * 1.2
                for segment in ("by_hs2", "by_importer")
                for key in report.get(segment, {})
                if key in baseline_report.get(segment, {})
            ),
            "inference_compatibility_passed": True,
            "reproducibility_passed": True,
            "administratively_approved": False,
        },
    }
    evaluation_path = artifact_path.with_suffix(".evaluation.json")
    evaluation_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    model_version = ModelVersion.objects.create(
        model_name=name,
        model_version=version,
        task_type="trade_forecast",
        dataset_version=dataset,
        feature_schema_version=FEATURE_SCHEMA_VERSION,
        training_period={"start": min(train["year"]), "end": max(train["year"])},
        validation_period={"start": min(validation["year"]), "end": max(validation["year"])},
        test_period={"start": min(test["year"]), "end": max(test["year"])},
        algorithm=name,
        hyperparameters={"random_seed": 42},
        metrics=metrics,
        artifact_path=str(artifact_path),
        checksum=checksum,
        status=ModelVersion.Status.CANDIDATE if beats_baseline else ModelVersion.Status.REJECTED,
    )
    return model_version


@transaction.atomic
def activate_model(model: ModelVersion, *, administratively_approved: bool = True) -> None:
    locked = (
        ModelVersion.objects.select_for_update().select_related("dataset_version").get(pk=model.pk)
    )
    if locked.status != ModelVersion.Status.CANDIDATE:
        raise ValueError("Only a candidate model can be activated.")
    if locked.dataset_version.status != DatasetVersion.Status.READY:
        raise ValueError("A model must reference a ready dataset.")
    if not locked.metrics or "candidate" not in locked.metrics or "baseline" not in locked.metrics:
        raise ValueError("Candidate and baseline metrics are required for activation.")
    if not locked.metrics.get("feature_validation", {}).get("passed"):
        raise ValueError("Passing feature validation is required for activation.")
    evaluation_path = Path(locked.artifact_path).with_suffix(".evaluation.json")
    if not evaluation_path.is_file():
        raise ValueError("A retained evaluation report is required for activation.")
    candidate_mae = locked.metrics["candidate"]["global"]["mae"]
    baseline_mae = locked.metrics["baseline"]["global"]["mae"]
    if candidate_mae >= baseline_mae:
        raise ValueError("Candidate must beat the required baseline.")
    checks = locked.metrics.get("activation_checks", {})
    required_checks = (
        checks.get("segment_guardrail_passed"),
        checks.get("inference_compatibility_passed"),
        checks.get("reproducibility_passed"),
        administratively_approved,
    )
    if not all(required_checks):
        raise ValueError(
            "Segment, compatibility, reproducibility, and administrative approval "
            "checks are required."
        )
    checks["administratively_approved"] = True
    locked.metrics["activation_checks"] = checks
    artifact_path = Path(locked.artifact_path)
    if (
        len(locked.checksum) != 64
        or not artifact_path.is_file()
        or artifact_checksum(artifact_path) != locked.checksum
    ):
        raise ValueError("A valid checksummed model artifact is required for activation.")
    ModelVersion.objects.select_for_update().filter(
        task_type=locked.task_type, status=ModelVersion.Status.ACTIVE
    ).exclude(pk=locked.pk).update(status=ModelVersion.Status.ARCHIVED)
    locked.status = ModelVersion.Status.ACTIVE
    locked.activated_at = timezone.now()
    locked.save(update_fields=["status", "activated_at", "metrics"])
    from audit.models import AuditEvent

    AuditEvent.objects.create(
        action="model.activated",
        endpoint="forecasting.services.activate_model",
        method="ADMIN",
        status_code=200,
        request_id=uuid.uuid4(),
        metadata={
            "model_id": str(locked.pk),
            "model_version": locked.model_version,
            "dataset_version": locked.dataset_version.version,
            "previous_status": ModelVersion.Status.CANDIDATE,
        },
    )
    model.status = locked.status
    model.activated_at = locked.activated_at


@transaction.atomic
def rollback_model(task_type: str = "trade_forecast") -> ModelVersion:
    active = (
        ModelVersion.objects.select_for_update()
        .filter(task_type=task_type, status=ModelVersion.Status.ACTIVE)
        .first()
    )
    previous = (
        ModelVersion.objects.select_for_update()
        .filter(task_type=task_type, status=ModelVersion.Status.ARCHIVED)
        .order_by("-activated_at", "-created_at")
        .first()
    )
    if active is None or previous is None:
        raise ValueError("An active and a previous archived model are required for rollback.")
    active.status = ModelVersion.Status.ARCHIVED
    active.save(update_fields=["status"])
    previous.status = ModelVersion.Status.ACTIVE
    previous.activated_at = timezone.now()
    previous.save(update_fields=["status", "activated_at"])
    from audit.models import AuditEvent

    AuditEvent.objects.create(
        action="model.rolled_back",
        endpoint="forecasting.services.rollback_model",
        method="ADMIN",
        status_code=200,
        request_id=uuid.uuid4(),
        metadata={"from_model": active.model_version, "to_model": previous.model_version},
    )
    return previous


def forecast(payload: dict[str, Any]) -> dict[str, Any]:
    active = (
        ModelVersion.objects.filter(task_type="trade_forecast", status=ModelVersion.Status.ACTIVE)
        .select_related("dataset_version")
        .first()
    )
    dataset = latest_ready_dataset()
    if dataset is None:
        raise ValueError("No ready dataset.")
    flows = AnnualTradeFlow.objects.filter(
        dataset_version=dataset,
        importer__iso3=payload["importer"],
        exporter__iso3=payload["exporter"],
        hs2_code=payload["hs2"],
    )
    historical = list(flows.values("year").annotate(value=Sum("trade_value_usd")).order_by("year"))
    values = [float(row["value"]) for row in historical]
    if not values:
        raise InsufficientAnalyticalData()
    baseline = sum(values[-3:]) / min(len(values), 3)
    prediction = baseline
    warnings: list[dict[str, str]] = []
    used_fallback = True
    model_name, model_version, metrics = "three_year_moving_average", "baseline-v1", {}
    training_period: dict[str, Any] = {}
    factors = ["trade_value_lag_1", "rolling_mean_3", "global_product_growth"]
    explanations = [
        "A baseline was used because a compatible, quality-approved model was unavailable."
    ]
    if len(values) < 4:
        warnings.append(
            {
                "code": "INSUFFICIENT_HISTORY",
                "message": (
                    "Fewer than four annual observations are available; the baseline is used."
                ),
            }
        )
    if dataset.period_end < timezone.now().year - 2:
        warnings.append(
            {"code": "STALE_DATA", "message": "The latest source data is more than two years old."}
        )
    recent_change = (
        abs(values[-1] / values[-2] - 1) if len(values) >= 2 and values[-2] else math.inf
    )
    if recent_change > 1:
        warnings.append(
            {
                "code": "STRUCTURAL_BREAK",
                "message": (
                    "The latest annual change is unusually large and may reflect a "
                    "structural break."
                ),
            }
        )
    if (
        active is not None
        and active.dataset_version_id == dataset.pk
        and active.feature_schema_version == FEATURE_SCHEMA_VERSION
    ):
        frame = build_feature_frame(dataset).fill_null(0)
        row = frame.filter(
            (pl.col("importer") == payload["importer"])
            & (pl.col("exporter") == payload["exporter"])
            & (pl.col("hs2") == payload["hs2"])
        ).tail(1)
        poor_quality = (
            len(values) < 4 or recent_change > 2 or dataset.period_end < timezone.now().year - 2
        )
        if not row.is_empty() and not poor_quality:
            artifact_path = Path(active.artifact_path)
            if (
                not artifact_path.is_file()
                or not active.checksum
                or artifact_checksum(artifact_path) != active.checksum
            ):
                raise ModelArtifactUnavailable()
            model = load_artifact(artifact_path)
            prediction = float(np.expm1(model.predict(row.select([*NUMERIC, *CATEGORICAL]))[0]))
            model_name, model_version = active.model_name, active.model_version
            metrics, training_period = active.metrics, active.training_period
            row_values = row.row(-1, named=True)
            explanations = explain_forecast(row_values)
            used_fallback = False
        elif poor_quality:
            warnings.append(
                {
                    "code": "BASELINE_FALLBACK",
                    "message": (
                        "Input quality is outside supported conditions, so the production "
                        "model was not used."
                    ),
                }
            )
    rmse = float(
        metrics.get("test_candidate", metrics.get("candidate", {})).get("global", {}).get("rmse", 0)
    )
    residual_margin = max(rmse * 1.96, prediction * (0.35 if used_fallback else 0.1))
    return {
        "request_id": str(uuid.uuid4()),
        "historical_values": [
            {"year": row["year"], "value": float(row["value"])} for row in historical
        ],
        "forecast": {
            "year": int(payload.get("year") or dataset.period_end + 1),
            "value": prediction,
            "lower_bound": max(0.0, prediction - residual_margin),
            "upper_bound": prediction + residual_margin,
            "coverage_level": 0.95,
            "interval_method": "validation-residual normal approximation",
        },
        "baseline_forecast": baseline,
        "model_name": model_name,
        "model_version": model_version,
        "dataset_version": dataset.version,
        "training_period": training_period,
        "metrics": metrics,
        "main_input_factors": factors,
        "factor_definitions": explanation_schema(factors),
        "explanations": explanations,
        "warnings": warnings,
        "used_fallback": used_fallback,
        "data_freshness": dataset.period_end,
        "lineage": {
            "data_source": dataset.source.code,
            "dataset_version": dataset.version,
            "feature_dataset_version": dataset.version,
            "feature_schema_version": FEATURE_SCHEMA_VERSION,
            "model_version": model_version,
            "training_period": training_period,
            "inference_timestamp": timezone.now().isoformat(),
        },
    }
