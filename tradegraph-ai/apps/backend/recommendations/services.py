from __future__ import annotations

import statistics
from collections import defaultdict
from typing import Any

from django.db.models import Sum
from trade.models import AnnualTradeFlow
from trade.services import latest_ready_dataset
from tradegraph_ml.recommendations import rank_suppliers


def supplier_recommendations(payload: dict[str, Any]) -> dict[str, Any]:
    dataset = latest_ready_dataset()
    if dataset is None:
        raise ValueError("No ready dataset.")
    end_year = int(payload.get("year") or dataset.period_end)
    flows = (
        AnnualTradeFlow.objects.filter(
            dataset_version=dataset,
            hs2_code=payload["hs2"],
            year__lte=end_year,
            year__gte=end_year - 7,
            trade_value_usd__gt=0,
        )
        .values("exporter__iso3", "exporter__name", "year")
        .annotate(value=Sum("trade_value_usd"), quantity=Sum("quantity_tons"))
        .order_by("year")
    )
    histories: dict[str, list[dict[str, Any]]] = defaultdict(list)
    names: dict[str, str] = {}
    for row in flows:
        iso3 = row["exporter__iso3"]
        names[iso3] = row["exporter__name"]
        histories[iso3].append(row)
    existing = set(
        AnnualTradeFlow.objects.filter(
            dataset_version=dataset,
            importer__iso3=payload["importer"],
            hs2_code=payload["hs2"],
            trade_value_usd__gt=0,
        ).values_list("exporter__iso3", flat=True)
    )
    candidates = []
    for iso3, history in histories.items():
        values = [float(row["value"]) for row in history]
        quantities = [float(row["quantity"] or 0) for row in history]
        growth = (values[-1] - values[0]) / values[0] if len(values) > 1 and values[0] else 0
        mean = statistics.fmean(values)
        volatility = statistics.pstdev(values) / mean if len(values) > 1 and mean else 0
        total_quantity = sum(quantities)
        candidates.append(
            {
                "country": iso3,
                "name": names[iso3],
                "recent_export_value": values[-1],
                "observations": len(history),
                "growth": growth,
                "volatility": volatility,
                "unit_value": sum(values) / total_quantity if total_quantity else 0,
                "existing_relationship": iso3 in existing,
                "hhi": min(values[-1] / sum(values), 1) if sum(values) else 1,
            }
        )
    return {
        "candidates": rank_suppliers(candidates, payload["importer"]),
        "data_freshness": dataset.period_end,
        "dataset_version": dataset.version,
        "methodology": "Transparent weighted ranking; this is not a trained ML model.",
    }
