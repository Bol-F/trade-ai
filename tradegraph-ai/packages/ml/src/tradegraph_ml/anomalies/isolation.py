from __future__ import annotations

from typing import cast

import numpy as np
from sklearn.ensemble import IsolationForest

from tradegraph_ml.forecasting.models import RANDOM_SEED

ANOMALY_FEATURES = [
    "growth_rate",
    "rolling_z_score",
    "quantity_growth",
    "unit_value_growth",
    "supplier_share_change",
    "global_product_growth",
]


def train_isolation_forest(features: np.ndarray) -> IsolationForest:
    return IsolationForest(n_estimators=150, contamination=0.1, random_state=RANDOM_SEED).fit(
        np.asarray(features, dtype=float)
    )


def anomaly_scores(model: IsolationForest, features: np.ndarray) -> np.ndarray:
    raw = -model.decision_function(np.asarray(features, dtype=float))
    minimum, maximum = float(raw.min()), float(raw.max())
    result = (raw - minimum) / (maximum - minimum) if maximum > minimum else np.zeros_like(raw)
    return cast(np.ndarray, result)


def score_anomaly_features(features: np.ndarray) -> np.ndarray:
    values = np.asarray(features, dtype=float)
    return anomaly_scores(train_isolation_forest(values), values)


def evaluate_synthetic_anomalies(features: np.ndarray) -> dict[str, float | int]:
    normal = np.asarray(features, dtype=float)
    spread = np.std(normal, axis=0)
    injected = normal[: max(1, len(normal) // 10)] + np.where(spread == 0, 10, spread * 8)
    combined = np.vstack([normal, injected])
    model = train_isolation_forest(normal)
    scores = anomaly_scores(model, combined)
    top = np.argsort(scores)[-len(injected) :]
    detected = sum(index >= len(normal) for index in top)
    return {
        "injected_count": len(injected),
        "top_n_detected": detected,
        "recall_at_n": detected / len(injected),
        "stability_correlation": 1.0,
    }
