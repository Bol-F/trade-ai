from decimal import Decimal

import polars as pl
from catalog.models import Country
from datasets.models import DatasetVersion
from django.db import transaction
from trade.models import AnnualTradeFlow


@transaction.atomic
def load_trade_flows(frame: pl.DataFrame, dataset: DatasetVersion) -> int:
    countries = {country.baci_code: country for country in Country.objects.all()}
    before = AnnualTradeFlow.objects.filter(dataset_version=dataset).count()
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
                trade_value_usd=Decimal(str(row["trade_value_usd"])),
                quantity_tons=Decimal(str(quantity)) if quantity is not None else None,
                unit_value_usd_per_ton=Decimal(str(unit_value)) if unit_value is not None else None,
                source=dataset.source,
            )
        )
    AnnualTradeFlow.objects.bulk_create(flows, batch_size=1000, ignore_conflicts=True)
    after = AnnualTradeFlow.objects.filter(dataset_version=dataset).count()
    return after - before
