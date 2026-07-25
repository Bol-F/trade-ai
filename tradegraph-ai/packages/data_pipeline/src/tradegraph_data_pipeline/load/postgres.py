from decimal import Decimal

import polars as pl
from catalog.models import Country
from datasets.models import DatasetVersion
from django.db import transaction
from trade.models import AnnualTradeFlow

MONEY_QUANTUM = Decimal("0.01")
QUANTITY_QUANTUM = Decimal("0.001")
UNIT_VALUE_QUANTUM = Decimal("0.0001")


@transaction.atomic
def load_trade_flows(frame: pl.DataFrame, dataset: DatasetVersion) -> int:
    countries = {country.baci_code: country for country in Country.objects.all()}
    flows: list[AnnualTradeFlow] = []
    for row in frame.iter_rows(named=True):
        quantity = row["quantity_tons"]
        unit_value = row["unit_value_usd_per_ton"]
        flows.append(
            AnnualTradeFlow(
                dataset_version=dataset,
                year=row["year"],
                classification=dataset.classification,
                hs6_code=row["hs6_code"],
                hs4_code=row["hs4_code"],
                hs2_code=row["hs2_code"],
                exporter=countries[row["exporter_code"]],
                importer=countries[row["importer_code"]],
                trade_value_usd=Decimal(str(row["trade_value_usd"])).quantize(MONEY_QUANTUM),
                quantity_tons=(
                    Decimal(str(quantity)).quantize(QUANTITY_QUANTUM)
                    if quantity is not None
                    else None
                ),
                unit_value_usd_per_ton=(
                    Decimal(str(unit_value)).quantize(UNIT_VALUE_QUANTUM)
                    if unit_value is not None
                    else None
                ),
                source=dataset.source,
            )
        )
    existing = {
        (row["year"], row["exporter_id"], row["importer_id"], row["hs6_code"]): row
        for row in AnnualTradeFlow.objects.filter(
            dataset_version=dataset,
            year__in={flow.year for flow in flows},
        ).values(
            "year",
            "exporter_id",
            "importer_id",
            "hs6_code",
            "trade_value_usd",
            "quantity_tons",
            "unit_value_usd_per_ton",
        )
    }
    pending: list[AnnualTradeFlow] = []
    for flow in flows:
        key = (flow.year, flow.exporter_id, flow.importer_id, flow.hs6_code)
        current = existing.get(key)
        if current is None:
            pending.append(flow)
            continue
        if (
            current["trade_value_usd"] != flow.trade_value_usd
            or current["quantity_tons"] != flow.quantity_tons
            or current["unit_value_usd_per_ton"] != flow.unit_value_usd_per_ton
        ):
            raise ValueError(f"Conflicting duplicate trade flow for {key}.")
    AnnualTradeFlow.objects.bulk_create(pending, batch_size=1000)
    return len(pending)
