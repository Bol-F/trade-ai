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
    candidates: list[dict[str, Any]], importer: str, minimum_observations: int = 3
) -> list[dict[str, Any]]:
    eligible = [
        item
        for item in candidates
        if item["country"] != importer
        and item["recent_export_value"] > 0
        and item["observations"] >= minimum_observations
    ]
    if not eligible:
        return []
    capacity_max = max(float(item["recent_export_value"]) for item in eligible) or 1
    unit_values = [float(item.get("unit_value", 0) or 0) for item in eligible]
    unit_max = max(unit_values) or 1
    ranked = []
    for item in eligible:
        components = {
            "export_capacity": min(float(item["recent_export_value"]) / capacity_max, 1),
            "export_growth": min(max((float(item.get("growth", 0)) + 1) / 2, 0), 1),
            "export_stability": min(max(1 - float(item.get("volatility", 1)), 0), 1),
            "estimated_unit_value": max(0, 1 - float(item.get("unit_value", 0) or 0) / unit_max),
            "existing_trade_relationship": 1.0 if item.get("existing_relationship") else 0.0,
            "supplier_diversification": min(max(1 - float(item.get("hhi", 1)), 0), 1),
        }
        score = sum(components[name] * weight for name, weight in WEIGHTS.items()) * 100
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
            }
        )
    return sorted(ranked, key=lambda item: item["recommendation_score"], reverse=True)
