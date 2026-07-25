from __future__ import annotations

import statistics
from collections import defaultdict
from typing import Any, cast

import numpy as np
from catalog.models import Product
from django.db.models import Avg, Count, Q, QuerySet, Sum
from trade.models import AnnualTradeFlow
from tradegraph_ml.anomalies.isolation import score_anomaly_features

from analytics.calculations import cagr, exposure_components, growth, hhi, robust_z_scores


def yearly_series(flows: QuerySet[AnnualTradeFlow]) -> list[dict[str, Any]]:
    return list(
        flows.values("year")
        .annotate(value=Sum("trade_value_usd"), quantity=Sum("quantity_tons"))
        .order_by("year")
    )


def concentration_data(flows: QuerySet[AnnualTradeFlow]) -> dict[str, Any]:
    suppliers = list(
        flows.filter(trade_value_usd__gt=0)
        .values("exporter__iso3", "exporter__name")
        .annotate(value=Sum("trade_value_usd"))
        .order_by("-value")
    )
    values = [float(row["value"]) for row in suppliers]
    total = sum(values)
    return {
        "hhi": round(hhi(values), 6),
        "supplier_count": len(suppliers),
        "suppliers": [
            {
                "iso3": row["exporter__iso3"],
                "name": row["exporter__name"],
                "trade_value_usd": float(row["value"]),
                "share": round(float(row["value"]) / total, 6) if total else 0,
            }
            for row in suppliers
        ],
    }


def exposure_data(flows: QuerySet[AnnualTradeFlow]) -> dict[str, Any]:
    concentration = concentration_data(flows)
    series = yearly_series(flows)
    values = [float(row["value"] or 0) for row in series]
    quantities = [
        float(row["quantity"]) if row["quantity"] is not None else None for row in series
    ]
    components = exposure_components(
        concentration["hhi"], values, concentration["supplier_count"], quantities
    )
    return {
        "score": components.score,
        "components": components.as_dict(),
        "component_explanations": components.explanations(),
        "insufficient_history": components.insufficient_history,
        "quantity_data_available": components.quantity_data_available,
        "methodology": (
            "Transparent trade supply exposure indicator; it is not a complete "
            "national-security or economic-risk score."
        ),
        "hhi": concentration["hhi"],
        "supplier_count": concentration["supplier_count"],
        "volatility": components.trade_value_volatility,
    }


def anomaly_data(flows: QuerySet[AnnualTradeFlow]) -> list[dict[str, Any]]:
    series = yearly_series(flows)
    values = [float(row["value"] or 0) for row in series]
    quantities = [
        float(row["quantity"]) if row["quantity"] is not None else None for row in series
    ]
    unit_rows = {
        row["year"]: float(row["unit_value"]) if row["unit_value"] is not None else None
        for row in flows.values("year").annotate(unit_value=Avg("unit_value_usd_per_ton"))
    }
    supplier_counts = {
        row["year"]: row["count"]
        for row in flows.filter(trade_value_usd__gt=0)
        .values("year")
        .annotate(count=Count("exporter", distinct=True))
    }
    # Aggregate every year/supplier pair in one query. The previous implementation
    # issued an additional query for every year in the requested range.
    supplier_values_by_year: dict[int, list[float]] = defaultdict(list)
    for row in (
        flows.values("year", "exporter_id")
        .annotate(value=Sum("trade_value_usd"))
        .order_by()
    ):
        supplier_values_by_year[row["year"]].append(float(row["value"]))
    supplier_shares: dict[int, float] = {}
    for year, supplier_values in supplier_values_by_year.items():
        supplier_total = sum(supplier_values)
        supplier_shares[year] = max(supplier_values) / supplier_total if supplier_total else 0
    changes = [0.0]
    for index in range(1, len(values)):
        changes.append(growth(values[index], values[index - 1]) or 0.0)
    z_scores = robust_z_scores(changes[1:])
    results: list[dict[str, Any]] = []
    for index, row in enumerate(series):
        features: list[str] = []
        scores: list[float] = []
        change_score = abs(z_scores[index - 1]) if index else 0.0
        if change_score >= 2:
            features.append("year_over_year_robust_z_score")
            scores.append(change_score)
        if index >= 2:
            baseline = statistics.fmean(values[max(0, index - 3) : index])
            rolling = abs(values[index] - baseline) / baseline if baseline else 0
            if rolling >= 0.3:
                features.append("rolling_deviation")
                scores.append(rolling * 3)
        if index and supplier_counts.get(row["year"], 0) < supplier_counts.get(
            series[index - 1]["year"], 0
        ):
            features.append("supplier_disappearance")
            scores.append(2.0)
        for feature, current, previous in (
            (
                "unusual_unit_value_change",
                unit_rows.get(row["year"]),
                unit_rows.get(series[index - 1]["year"]) if index else None,
            ),
            (
                "unusual_quantity_change",
                quantities[index],
                quantities[index - 1] if index else None,
            ),
        ):
            delta = abs(growth(current, previous) or 0)
            if delta >= 0.5:
                features.append(feature)
                scores.append(delta * 2)
        score = round(min(max(scores, default=0.0), 10), 2)
        severity = "high_anomaly" if score >= 3.5 else "watch" if score >= 2 else "normal"
        direction = "up" if changes[index] > 0 else "down" if changes[index] < 0 else "flat"
        results.append(
            {
                "year": row["year"],
                "anomaly_score": score,
                "severity": severity,
                "direction": direction,
                "detected_features": features,
                "explanation": (
                    "Detected: " + ", ".join(feature.replace("_", " ") for feature in features)
                    if features
                    else "No material rule-based anomaly detected."
                ),
            }
        )
    feature_rows = []
    for index, row in enumerate(series):
        previous_year = series[index - 1]["year"] if index else row["year"]
        feature_rows.append(
            [
                changes[index],
                z_scores[index - 1] if index else 0,
                growth(quantities[index], quantities[index - 1]) or 0 if index else 0,
                growth(unit_rows.get(row["year"]), unit_rows.get(previous_year)) or 0,
                supplier_shares.get(row["year"], 0) - supplier_shares.get(previous_year, 0),
                changes[index],
            ]
        )
    ml_scores = (
        score_anomaly_features(np.asarray(feature_rows, dtype=float))
        if len(feature_rows) >= 2
        else np.zeros(len(feature_rows))
    )
    for result, ml_score in zip(results, ml_scores, strict=True):
        result["rule_based_score"] = result["anomaly_score"]
        result["ml_anomaly_score"] = round(float(ml_score), 4)
    return results


def country_profile(flows: QuerySet[AnnualTradeFlow], iso3: str) -> dict[str, Any]:
    imports = flows.filter(importer__iso3=iso3)
    exports = flows.filter(exporter__iso3=iso3)
    totals = flows.aggregate(
        imports=Sum("trade_value_usd", filter=Q(importer__iso3=iso3)),
        exports=Sum("trade_value_usd", filter=Q(exporter__iso3=iso3)),
    )
    import_total = float(totals["imports"] or 0)
    export_total = float(totals["exports"] or 0)
    combined = flows.filter(importer__iso3=iso3) | flows.filter(exporter__iso3=iso3)
    product_rows = list(
        combined.values("hs2_code").annotate(value=Sum("trade_value_usd")).order_by("-value")[:5]
    )
    concentration = concentration_data(imports)
    history = yearly_series(combined)
    import_history = yearly_series(imports)
    values = [float(row["value"] or 0) for row in import_history]
    quantities = [
        float(row["quantity"]) if row["quantity"] is not None else None
        for row in import_history
    ]
    components = exposure_components(
        concentration["hhi"], values, concentration["supplier_count"], quantities
    )
    exposure = {
        "score": components.score,
        "components": components.as_dict(),
        "component_explanations": components.explanations(),
        "insufficient_history": components.insufficient_history,
        "quantity_data_available": components.quantity_data_available,
        "methodology": (
            "Transparent trade supply exposure indicator; it is not a complete "
            "national-security or economic-risk score."
        ),
        "hhi": concentration["hhi"],
        "supplier_count": concentration["supplier_count"],
        "volatility": components.trade_value_volatility,
    }
    return {
        "iso3": iso3,
        "total_imports_usd": import_total,
        "total_exports_usd": export_total,
        "top_products": [
            {"code": row["hs2_code"], "trade_value_usd": float(row["value"])}
            for row in product_rows
        ],
        "top_suppliers": concentration["suppliers"][:5],
        "top_destinations": partner_rows(exports, "importer")[:5],
        "concentration": concentration,
        "exposure": exposure,
        "history": history,
    }


def partner_rows(flows: QuerySet[AnnualTradeFlow], side: str) -> list[dict[str, Any]]:
    return [
        {
            "iso3": row[f"{side}__iso3"],
            "name": row[f"{side}__name"],
            "trade_value_usd": float(row["value"]),
        }
        for row in flows.values(f"{side}__iso3", f"{side}__name")
        .annotate(value=Sum("trade_value_usd"))
        .order_by("-value")
    ]


def product_profile(flows: QuerySet[AnnualTradeFlow], hs2: str) -> dict[str, Any]:
    product_flows = flows.filter(hs2_code=hs2)
    history = yearly_series(product_flows)
    country_series: dict[str, list[tuple[int, float]]] = defaultdict(list)
    for row in product_flows.values("exporter__iso3", "year").annotate(
        value=Sum("trade_value_usd")
    ):
        country_series[row["exporter__iso3"]].append((row["year"], float(row["value"])))
    fastest = []
    for iso3, points in country_series.items():
        points.sort()
        rate = cagr(points[0][1], points[-1][1], points[-1][0] - points[0][0])
        if rate is not None:
            fastest.append({"iso3": iso3, "cagr": rate})
    name = Product.objects.filter(code__startswith=hs2).values_list("name", flat=True).first() or ""
    return {
        "hs2": hs2,
        "name": name,
        "global_trend": history,
        "top_exporters": partner_rows(product_flows, "exporter")[:5],
        "top_importers": partner_rows(product_flows, "importer")[:5],
        "fastest_growing_countries": sorted(
            fastest, key=lambda item: cast(float, item["cagr"]), reverse=True
        )[:5],
        "concentration": concentration_data(product_flows),
        "anomalies": anomaly_data(product_flows),
    }
