from pathlib import Path
from typing import cast

import numpy as np
import polars as pl
from sklearn.linear_model import Ridge
from tradegraph_ml.anomalies import evaluate_synthetic_anomalies, train_isolation_forest
from tradegraph_ml.evaluation import chronological_split, drift_report, evaluate, expanding_window_splits
from tradegraph_ml.explainability import explanation_schema
from tradegraph_ml.features import build_forecast_features, validate_feature_frame
from tradegraph_ml.forecasting import RANDOM_SEED, moving_average_forecast, previous_year_forecast
from tradegraph_ml.recommendations import rank_suppliers, ranking_sensitivity
from tradegraph_ml.registry import artifact_checksum, load_artifact, save_artifact


def flow_frame() -> pl.DataFrame:
    return pl.DataFrame(
        {
            "year": list(range(2017, 2025)),
            "importer": ["UZB"] * 8,
            "exporter": ["CHN"] * 8,
            "hs2": ["01"] * 8,
            "trade_value_usd": [100, 110, 120, 130, 140, 150, 160, 170],
            "quantity_tons": [10, 11, 12, 13, 14, 15, 16, 17],
            "supplier_share": [0.5] * 8,
            "supplier_count": [2] * 8,
            "hhi": [0.5] * 8,
            "global_product_growth": [0.1] * 8,
        }
    )


def test_features_use_only_past_values_and_preserve_keys() -> None:
    features = build_forecast_features(flow_frame())
    row = features.filter(pl.col("year") == 2020).row(0, named=True)
    assert row["trade_value_lag_1"] == 120
    assert row["trade_value_lag_2"] == 110
    assert row["target"] == np.log1p(140)
    assert row["hs2"] == "01"


def test_chronological_split_never_mixes_future() -> None:
    frame = build_forecast_features(flow_frame())
    train, validation, test = chronological_split(frame, 2022, 2023)
    train_end = cast(int, train["year"].max())
    validation_start = cast(int, validation["year"].min())
    test_start = cast(int, test["year"].min())
    assert train_end < validation_start < test_start


def test_seed_baselines_and_metrics_are_deterministic() -> None:
    assert RANDOM_SEED == 42
    assert previous_year_forecast(np.array([10, 20])).tolist() == [10, 20]
    assert moving_average_forecast(np.array([[10, 20, 30]])).tolist() == [20]
    assert evaluate(np.array([10, 20]), np.array([10, 20]))["rmse"] == 0


def test_model_serialization_is_checksum_verified(tmp_path: Path) -> None:
    model = Ridge().fit([[1], [2]], [2, 4])
    path = tmp_path / "ridge.joblib"
    checksum = save_artifact(model, path)
    assert checksum == artifact_checksum(path)
    assert load_artifact(path).predict([[3]])[0] >= 4


def test_supplier_ranking_excludes_importer_and_is_sorted() -> None:
    candidates = [
        {"country": "UZB", "recent_export_value": 100, "observations": 8},
        {
            "country": "CHN",
            "name": "China",
            "recent_export_value": 500,
            "observations": 8,
            "growth": 0.2,
            "volatility": 0.1,
            "unit_value": 5,
            "hhi": 0.3,
        },
        {
            "country": "DEU",
            "name": "Germany",
            "recent_export_value": 300,
            "observations": 8,
            "growth": 0.1,
            "volatility": 0.2,
            "unit_value": 6,
            "hhi": 0.4,
        },
    ]
    ranked = rank_suppliers(candidates, "UZB")
    assert [item["country"] for item in ranked] == ["CHN", "DEU"]
    assert set(ranked[0]["component_scores"]) == {
        "export_capacity",
        "export_growth",
        "export_stability",
        "estimated_unit_value",
        "existing_trade_relationship",
        "supplier_diversification",
    }


def test_synthetic_anomalies_and_repeated_training_are_stable() -> None:
    random = np.random.default_rng(RANDOM_SEED)
    features = random.normal(size=(100, 6))
    report = evaluate_synthetic_anomalies(features)
    first = train_isolation_forest(features).decision_function(features)
    second = train_isolation_forest(features).decision_function(features)
    assert report["recall_at_n"] >= 0.8
    assert np.array_equal(first, second)


def test_missing_calendar_year_does_not_become_lag_one() -> None:
    frame = flow_frame().filter(pl.col("year") != 2020)
    features = build_forecast_features(frame)
    assert features.filter(pl.col("year") == 2021)["trade_value_lag_1"].null_count() == 0 or features.filter(pl.col("year") == 2021).is_empty()
    assert features.filter(pl.col("year") == 2019)["target"].null_count() == 0 or features.filter(pl.col("year") == 2019).is_empty()


def test_feature_validation_blocks_duplicates_infinity_and_mixed_versions() -> None:
    valid = build_forecast_features(flow_frame(), "dataset-v1")
    assert validate_feature_frame(valid, "dataset-v1").passed
    duplicate = pl.concat([valid, valid.head(1)])
    assert not validate_feature_frame(duplicate, "dataset-v1").passed
    infinite = valid.with_columns(pl.lit(float("inf")).alias("growth_lag_1"))
    assert not validate_feature_frame(infinite, "dataset-v1").passed
    mixed = valid.with_row_index().with_columns(
        pl.when(pl.col("index") == 0).then(pl.lit("dataset-v2")).otherwise(pl.col("feature_dataset_version")).alias("feature_dataset_version")
    ).drop("index")
    assert not validate_feature_frame(mixed, "dataset-v1").passed


def test_expanding_windows_are_strictly_chronological() -> None:
    features = build_forecast_features(flow_frame())
    splits = expanding_window_splits(features, minimum_training_years=2)
    assert splits
    assert all(cast(int, train["year"].max()) < cast(int, test["year"].min()) for train, test in splits)


def test_drift_requires_review_but_never_auto_retrains() -> None:
    report = drift_report({"trade_value": np.arange(100)}, {"trade_value": np.arange(100) + 1000})
    assert report["requires_review"]
    assert report["automatic_retraining"] is False


def test_supplier_scores_and_sensitivity_are_bounded_and_deterministic() -> None:
    candidates = [
        {"country": "CHN", "recent_export_value": 1000, "observations": 4, "unit_value": None},
        {"country": "DEU", "recent_export_value": 900, "observations": 8, "unit_value": 10},
    ]
    ranked = rank_suppliers(candidates, "UZB")
    assert all(0 <= item["recommendation_score"] <= 100 for item in ranked)
    assert ranked[0]["insufficient_history"] is True
    sensitivity = ranking_sensitivity(candidates, "UZB")
    assert 0 <= sensitivity["top_candidate_stability"] <= 1


def test_explainability_schema_never_exposes_unlabelled_codes() -> None:
    schema = explanation_schema(["trade_value_lag_1", "rolling_std_3", "unknown"])
    assert len(schema) == 2
    assert all({"display_name", "description", "unit", "direction", "limitation"} <= item.keys() for item in schema)
