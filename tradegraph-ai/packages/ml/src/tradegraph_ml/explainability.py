from __future__ import annotations

from typing import Any

FEATURE_CATALOG: dict[str, dict[str, str]] = {
    "trade_value_lag_1": {
        "display_name": "Recent trade value",
        "description": "Trade value in the previous calendar year.",
        "unit": "USD",
        "direction": "Higher values usually increase the forecast.",
        "limitation": "Does not capture unobserved policy or geopolitical events.",
    },
    "rolling_mean_3": {
        "display_name": "Three-year trade average",
        "description": "Mean of up to three prior annual trade values.",
        "unit": "USD",
        "direction": "A higher recent average usually increases the forecast.",
        "limitation": "Short histories use fewer observations.",
    },
    "rolling_std_3": {
        "display_name": "Recent volatility",
        "description": "Variation in the previous three annual values.",
        "unit": "USD",
        "direction": "Higher volatility reduces confidence.",
        "limitation": "Three observations cannot represent every structural change.",
    },
    "global_product_growth": {
        "display_name": "Global product growth",
        "description": "Recent global growth for the HS2 category.",
        "unit": "ratio",
        "direction": "Positive global growth can increase the forecast.",
        "limitation": "Global growth may not apply to a bilateral flow.",
    },
    "supplier_share": {
        "display_name": "Supplier share",
        "description": "Exporter share of importer demand for this HS2.",
        "unit": "ratio",
        "direction": "A larger share can increase expected trade.",
        "limitation": "Concentration can reverse after supply disruptions.",
    },
}


def explanation_schema(feature_names: list[str]) -> list[dict[str, str]]:
    return [
        {"feature": name, **FEATURE_CATALOG[name]}
        for name in feature_names
        if name in FEATURE_CATALOG
    ]


def explain_forecast(row: dict[str, Any], prior: dict[str, Any] | None = None) -> list[str]:
    explanations: list[str] = []
    if float(row.get("growth_lag_1") or 0) > 0.1:
        explanations.append("Recent trade growth increased the forecast.")
    if float(row.get("rolling_std_3") or 0) > float(row.get("rolling_mean_3") or 0) * 0.5:
        explanations.append("High recent volatility reduced confidence.")
    if prior and float(row.get("supplier_share") or 0) > float(prior.get("supplier_share") or 0):
        explanations.append("Supplier share increased compared with the previous year.")
    if float(row.get("global_product_growth") or 0) < 0:
        explanations.append("Global product trade declined.")
    return explanations or [
        "The forecast mainly follows recent trade levels and the three-year average."
    ]
