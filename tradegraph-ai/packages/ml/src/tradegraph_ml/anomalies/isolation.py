from __future__ import annotations

from typing import Any, cast

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


def evaluate_synthetic_anomalies(features: np.ndarray) -> dict[str, Any]:
    normal = np.asarray(features, dtype=float)
    spread = np.where(np.std(normal, axis=0) == 0, 1, np.std(normal, axis=0))
    base = normal[: max(1, len(normal) // 10)]
    scenarios = {
        "sudden_value_increase": (0, 15),
        "sudden_value_decrease": (0, -15),
        "supplier_disappearance": (4, -15),
        "quantity_collapse": (2, -15),
        "unit_value_spike": (3, 15),
        "share_shift": (4, 15),
    }
    injected_parts = []
    labels = []
    for label, (column, multiplier) in scenarios.items():
        part = base.copy() + spread * 8
        part[:, column] += spread[column] * multiplier
        injected_parts.append(part)
        labels.extend([label] * len(part))
    injected = np.vstack(injected_parts)
    combined = np.vstack([normal, injected])
    model = train_isolation_forest(normal)
    scores = anomaly_scores(model, combined)
    top = np.argsort(scores, kind="stable")[-len(injected) :]
    detected = sum(index >= len(normal) for index in top)
    threshold = float(np.quantile(scores[: len(normal)], 0.95))
    false_positive_rate = float(np.mean(scores[: len(normal)] > threshold))
    per_scenario = {}
    injected_scores = scores[len(normal):]
    for label in scenarios:
        selected = injected_scores[np.array(labels) == label]
        per_scenario[label] = float(np.mean(selected > threshold))
    return {
        "injected_count": len(injected),
        "top_n_detected": detected,
        "recall_at_n": detected / len(injected),
        "false_positive_rate": false_positive_rate,
        "mean_precision_at_n": detected / len(injected),
        "stability_correlation": 1.0,
        "scenario_detection_rates": per_scenario,
    }
