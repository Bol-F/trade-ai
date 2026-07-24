from __future__ import annotations

import json
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
from trade.models import AnnualTradeFlow
from trade.services import latest_ready_dataset
from tradegraph_ml.evaluation.metrics import chronological_split, grouped_evaluation
from tradegraph_ml.features import FEATURE_SCHEMA_VERSION, build_forecast_features
from tradegraph_ml.forecasting import build_hist_gradient_boosting, build_ridge
from tradegraph_ml.forecasting.models import CATEGORICAL, NUMERIC, moving_average_forecast
from tradegraph_ml.registry import load_artifact, save_artifact

from forecasting.models import ModelVersion

ARTIFACT_ROOT = Path(settings.BASE_DIR).parent.parent / "artifacts" / "ml"


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
    totals: dict[tuple[str, int], float] = {}
    supplier_counts: dict[tuple[str, str, int], int] = {}
    for row in rows:
        year = int(row["year"])
        hs2 = str(row["hs2_code"])
        importer = str(row["importer__iso3"])
        totals[(hs2, year)] = totals.get((hs2, year), 0) + float(row["trade_value_usd"])
        key = (importer, hs2, year)
        supplier_counts[key] = supplier_counts.get(key, 0) + 1
    normalized = []
    previous_global: dict[str, float] = {}
    for row in rows:
        year = int(row["year"])
        hs2 = str(row["hs2_code"])
        importer = str(row["importer__iso3"])
        value = float(row["trade_value_usd"])
        total = totals[(hs2, year)]
        prior = previous_global.get(hs2)
        global_growth = (total - prior) / prior if prior else 0
        previous_global[hs2] = total
        count = supplier_counts[(importer, hs2, year)]
        share = value / total if total else 0
        normalized.append(
            {
                "year": year,
                "importer": importer,
                "exporter": str(row["exporter__iso3"]),
                "hs2": hs2,
                "trade_value_usd": value,
                "quantity_tons": float(row["quantity_tons"] or 0),
                "supplier_share": share,
                "supplier_count": count,
                "hhi": share**2,
                "global_product_growth": global_growth,
            }
        )
    return build_forecast_features(pl.DataFrame(normalized))


def train_forecast_models(dataset: DatasetVersion | None = None) -> ModelVersion:
    dataset = dataset or latest_ready_dataset()
    if dataset is None:
        raise ValueError("No ready dataset.")
    frame = build_feature_frame(dataset).fill_null(0)
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
        "candidate": report,
        "baseline": baseline_report,
        "test_candidate": grouped_evaluation(test, test_actual_usd, test_predictions),
        "test_baseline": grouped_evaluation(test, test_actual_usd, test_baseline),
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
    if beats_baseline:
        activate_model(model_version)
    return model_version


@transaction.atomic
def activate_model(model: ModelVersion) -> None:
    ModelVersion.objects.select_for_update().filter(
        task_type=model.task_type, status=ModelVersion.Status.ACTIVE
    ).exclude(pk=model.pk).update(status=ModelVersion.Status.ARCHIVED)
    model.status = ModelVersion.Status.ACTIVE
    model.activated_at = timezone.now()
    model.save(update_fields=["status", "activated_at"])


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
    baseline = sum(values[-3:]) / min(len(values), 3) if values else 0
    prediction = baseline
    model_name, model_version, metrics = "three_year_moving_average", "baseline-v1", {}
    training_period: dict[str, Any] = {}
    factors = ["trade_value_lag_1", "rolling_mean_3", "global_product_growth"]
    if active is not None:
        frame = build_feature_frame(dataset).fill_null(0)
        row = frame.filter(
            (pl.col("importer") == payload["importer"])
            & (pl.col("exporter") == payload["exporter"])
            & (pl.col("hs2") == payload["hs2"])
        ).tail(1)
        if not row.is_empty():
            model = load_artifact(Path(active.artifact_path))
            prediction = float(np.expm1(model.predict(row.select([*NUMERIC, *CATEGORICAL]))[0]))
            model_name, model_version = active.model_name, active.model_version
            metrics, training_period = active.metrics, active.training_period
    return {
        "request_id": str(uuid.uuid4()),
        "historical_values": [
            {"year": row["year"], "value": float(row["value"])} for row in historical
        ],
        "forecast": {
            "year": int(payload.get("year") or dataset.period_end + 1),
            "value": prediction,
        },
        "baseline_forecast": baseline,
        "model_name": model_name,
        "model_version": model_version,
        "dataset_version": dataset.version,
        "training_period": training_period,
        "metrics": metrics,
        "main_input_factors": factors,
        "data_freshness": dataset.period_end,
    }
