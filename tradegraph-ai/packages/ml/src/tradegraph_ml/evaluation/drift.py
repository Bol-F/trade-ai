from __future__ import annotations

from typing import Any

import numpy as np
from scipy.stats import ks_2samp


def population_stability_index(reference: np.ndarray, current: np.ndarray, bins: int = 10) -> float:
    reference, current = np.asarray(reference, dtype=float), np.asarray(current, dtype=float)
    edges = np.unique(np.quantile(reference, np.linspace(0, 1, bins + 1)))
    if len(edges) < 2:
        return 0.0
    expected = np.clip(np.histogram(reference, bins=edges)[0] / max(len(reference), 1), 1e-6, None)
    actual = np.clip(np.histogram(current, bins=edges)[0] / max(len(current), 1), 1e-6, None)
    return float(np.sum((actual - expected) * np.log(actual / expected)))


def drift_report(reference: dict[str, np.ndarray], current: dict[str, np.ndarray]) -> dict[str, Any]:
    metrics: dict[str, Any] = {}
    for name in sorted(reference.keys() & current.keys()):
        ref, cur = np.asarray(reference[name]), np.asarray(current[name])
        if not len(ref) or not len(cur):
            metrics[name] = {"status": "insufficient_data"}
            continue
        statistic, p_value = ks_2samp(ref.astype(float), cur.astype(float))
        psi = population_stability_index(ref, cur)
        metrics[name] = {"ks_statistic": float(statistic), "ks_p_value": float(p_value), "psi": psi, "drift_detected": bool((p_value < 0.01 and statistic >= 0.1) or psi >= 0.2)}
    return {"requires_review": any(item.get("drift_detected", False) for item in metrics.values()), "metrics": metrics, "automatic_retraining": False}
