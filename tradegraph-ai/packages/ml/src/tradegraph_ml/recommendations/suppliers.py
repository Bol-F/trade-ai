from __future__ import annotations

from typing import Any

WEIGHTS = {
    "export_capacity": 0.30,
    "export_growth": 0.20,
    "export_stability": 0.15,
    "estimated_unit_value": 0.10,
    "existing_trade_relationship": 0.10,
    "supplier_diversification": 0.15,
}


def rank_suppliers(
    candidates: list[dict[str, Any]],
    importer: str,
    minimum_observations: int = 3,
    weights: dict[str, float] | None = None,
) -> list[dict[str, Any]]:
    weights = weights or WEIGHTS
    if set(weights) != set(WEIGHTS) or abs(sum(weights.values()) - 1) > 1e-9:
        raise ValueError("Supplier weights must cover every component and sum to one.")
    eligible = [
        item
        for item in candidates
        if item["country"] != importer
        and item["recent_export_value"] > 0
        and item["observations"] >= minimum_observations
    ]
    if not eligible:
        return []
    capacity_values = sorted(float(item["recent_export_value"]) for item in eligible)
    capacity_max = capacity_values[max(0, int(len(capacity_values) * 0.95) - 1)] or 1
    unit_values = [float(item.get("unit_value", 0) or 0) for item in eligible]
    positive_units = sorted(value for value in unit_values if value > 0)
    unit_max = positive_units[max(0, int(len(positive_units) * 0.95) - 1)] if positive_units else 1
    ranked = []
    for item in eligible:
        components = {
            "export_capacity": min(float(item["recent_export_value"]) / capacity_max, 1),
            "export_growth": min(max((float(item.get("growth", 0)) + 1) / 2, 0), 1),
            "export_stability": min(max(1 - float(item.get("volatility", 1)), 0), 1),
            "estimated_unit_value": (
                max(0, 1 - float(item["unit_value"]) / unit_max)
                if item.get("unit_value") is not None
                else 0.5
            ),
            "existing_trade_relationship": 1.0 if item.get("existing_relationship") else 0.0,
            "supplier_diversification": min(max(1 - float(item.get("hhi", 1)), 0), 1),
        }
        score = min(
            100.0,
            max(0.0, sum(components[name] * weight for name, weight in weights.items()) * 100),
        )
        reasons = [
            name.replace("_", " ")
            for name, value in sorted(components.items(), key=lambda pair: pair[1], reverse=True)
            if value >= 0.6
        ][:3]
        ranked.append(
            {
                "country": item["country"],
                "name": item.get("name", item["country"]),
                "recommendation_score": round(score, 2),
                "component_scores": {key: round(value, 4) for key, value in components.items()},
                "reasons": reasons,
                "insufficient_history": int(item["observations"]) < 5,
            }
        )
    return sorted(ranked, key=lambda item: (-item["recommendation_score"], item["country"]))


def ranking_sensitivity(
    candidates: list[dict[str, Any]], importer: str, variation: float = 0.1
) -> dict[str, Any]:
    baseline = rank_suppliers(candidates, importer)
    baseline_order = [item["country"] for item in baseline]
    scenarios: dict[str, list[str]] = {}
    for component in WEIGHTS:
        adjusted = dict(WEIGHTS)
        adjusted[component] *= 1 + variation
        total = sum(adjusted.values())
        adjusted = {name: value / total for name, value in adjusted.items()}
        scenarios[component] = [
            item["country"] for item in rank_suppliers(candidates, importer, weights=adjusted)
        ]
    return {
        "baseline_order": baseline_order,
        "scenarios": scenarios,
        "top_candidate_stability": (
            sum(order[:1] == baseline_order[:1] for order in scenarios.values()) / len(scenarios)
            if baseline_order
            else 1.0
        ),
    }
