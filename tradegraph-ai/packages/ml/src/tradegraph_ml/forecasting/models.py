from __future__ import annotations

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_SEED = 42
CATEGORICAL = ["importer", "exporter", "hs2"]
NUMERIC = [
    "trade_value_lag_1",
    "trade_value_lag_2",
    "trade_value_lag_3",
    "quantity_lag_1",
    "growth_lag_1",
    "rolling_mean_3",
    "rolling_std_3",
    "supplier_share",
    "supplier_count",
    "hhi",
    "global_product_growth",
    "year",
]


def previous_year_forecast(lag_1: np.ndarray) -> np.ndarray:
    return np.asarray(lag_1, dtype=float)


def moving_average_forecast(lags: np.ndarray) -> np.ndarray:
    return np.nanmean(np.asarray(lags, dtype=float), axis=1)


def _preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        [
            ("numeric", StandardScaler(), NUMERIC),
            (
                "categories",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
        ],
        remainder="drop",
    )


def build_ridge(alpha: float = 1.0) -> Pipeline:
    return Pipeline([("features", _preprocessor()), ("model", Ridge(alpha=alpha))])


def build_hist_gradient_boosting() -> Pipeline:
    return Pipeline(
        [
            ("features", _preprocessor()),
            (
                "model",
                HistGradientBoostingRegressor(
                    max_iter=150, max_depth=5, learning_rate=0.05, random_state=RANDOM_SEED
                ),
            ),
        ]
    )
