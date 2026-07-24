from pathlib import Path

import numpy as np
import polars as pl
from sklearn.linear_model import Ridge
from tradegraph_ml.anomalies import evaluate_synthetic_anomalies, train_isolation_forest
from tradegraph_ml.evaluation import chronological_split, evaluate
from tradegraph_ml.features import build_forecast_features
from tradegraph_ml.forecasting import RANDOM_SEED, moving_average_forecast, previous_year_forecast
from tradegraph_ml.recommendations import rank_suppliers
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
    assert train["year"].max() < validation["year"].min() < test["year"].min()


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
