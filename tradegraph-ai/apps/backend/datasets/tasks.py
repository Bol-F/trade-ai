from pathlib import Path

from catalog.models import Country, Product
from celery import shared_task
from django.db.models import Sum
from tradegraph_data_pipeline.extract.csv import read_baci_csv
from tradegraph_data_pipeline.validate.baci import validate_baci

from datasets.models import DatasetVersion
from datasets.services import import_sample_dataset


@shared_task(name="datasets.import_sample")  # type: ignore[untyped-decorator]
def import_sample_task() -> dict[str, int | str]:
    result = import_sample_dataset()
    return {
        "records_read": result.records_read,
        "records_written": result.records_written,
        "checksum": result.checksum,
    }


@shared_task(name="datasets.rebuild_aggregates")  # type: ignore[untyped-decorator]
def rebuild_aggregates_task(dataset_version_id: str) -> dict[str, float]:
    dataset = DatasetVersion.objects.get(pk=dataset_version_id)
    totals = dataset.trade_flows.aggregate(
        trade_value=Sum("trade_value_usd"), quantity=Sum("quantity_tons")
    )
    aggregates = {
        "trade_value_usd": float(totals["trade_value"] or 0),
        "quantity_tons": float(totals["quantity"] or 0),
    }
    dataset.metadata = {**dataset.metadata, "aggregates": aggregates}
    dataset.save(update_fields=["metadata"])
    return aggregates


@shared_task(name="datasets.validate_version")  # type: ignore[untyped-decorator]
def validate_dataset_version_task(dataset_version_id: str) -> dict[str, int]:
    dataset = DatasetVersion.objects.get(pk=dataset_version_id)
    raw_path = dataset.metadata.get("raw_path")
    if not raw_path:
        raise ValueError("Dataset metadata does not include raw_path.")
    result = validate_baci(
        read_baci_csv(Path(raw_path)),
        set(Country.objects.values_list("baci_code", flat=True)),
        set(
            Product.objects.filter(classification=dataset.classification).values_list(
                "code", flat=True
            )
        ),
    )
    return {
        "row_count": result.row_count,
        "period_start": result.min_year,
        "period_end": result.max_year,
    }
