from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from catalog.models import Country, Product
from datasets.models import DatasetVersion, IngestionRun
from django.utils import timezone

from tradegraph_data_pipeline.extract.streaming import materialized_csv, scan_baci_csv
from tradegraph_data_pipeline.load.parquet import write_partitioned_parquet
from tradegraph_data_pipeline.load.postgres import load_trade_flows
from tradegraph_data_pipeline.pipeline import calculate_checksum
from tradegraph_data_pipeline.transform.normalize import normalize_baci
from tradegraph_data_pipeline.validate.baci import validate_baci


@dataclass(frozen=True)
class StreamingResult:
    records_read: int
    records_written: int
    years_processed: list[int]
    checksum: str


def run_streaming_pipeline(
    source: str,
    dataset: DatasetVersion,
    storage_root: Path,
    expected_checksum: str = "",
    download_url: str | None = None,
) -> StreamingResult:
    previous_run = (
        dataset.ingestion_runs.filter(task_name="import_baci", status=IngestionRun.Status.FAILED)
        .order_by("-started_at")
        .first()
    )
    completed = set((previous_run.checkpoint if previous_run else {}).get("completed_years", []))
    run = IngestionRun.objects.create(
        dataset_version=dataset,
        task_name="import_baci",
        checkpoint={"completed_years": sorted(completed), "stage": "starting"},
    )
    total_read = total_written = 0
    try:
        dataset.status = DatasetVersion.Status.PROCESSING
        dataset.save(update_fields=["status"])
        with materialized_csv(source, download_url) as csv_path:
            checksum = (
                calculate_checksum(Path(source))
                if Path(source).is_file()
                else calculate_checksum(csv_path)
            )
            if expected_checksum and checksum.lower() != expected_checksum.lower():
                raise ValueError("BACI checksum verification failed.")
            lazy = scan_baci_csv(csv_path)
            required = {"t", "i", "j", "k", "v", "q"}
            if required - set(lazy.collect_schema().names()):
                raise ValueError("BACI file is missing required columns.")
            years = sorted(
                int(value)
                for value in lazy.select("t").unique().collect(engine="streaming")["t"].to_list()
            )
            countries = set(Country.objects.values_list("baci_code", flat=True))
            products = set(
                Product.objects.filter(classification=dataset.classification).values_list(
                    "code", flat=True
                )
            )
            destination = storage_root / dataset.version
            for year in years:
                if year in completed:
                    continue
                frame = lazy.filter(t=year).collect(engine="streaming")
                validation = validate_baci(frame, countries, products)
                normalized = normalize_baci(frame)
                write_partitioned_parquet(normalized, destination)
                written = load_trade_flows(normalized, dataset)
                total_read += validation.row_count
                total_written += written
                completed.add(year)
                run.records_read += validation.row_count
                run.records_written += written
                run.checkpoint = {
                    "stage": "year_complete",
                    "completed_years": sorted(completed),
                    "last_year": year,
                }
                run.save(update_fields=["records_read", "records_written", "checkpoint"])
            dataset.status = DatasetVersion.Status.READY
            dataset.checksum = checksum
            dataset.row_count = dataset.trade_flows.count()
            dataset.period_start = min(years)
            dataset.period_end = max(years)
            dataset.storage_path = str(destination)
            dataset.metadata = {
                **dataset.metadata,
                "raw_path": source,
                "format": "parquet",
                "partition_by": ["year"],
                "streaming": True,
            }
            dataset.save()
            run.status = IngestionRun.Status.SUCCEEDED
            run.finished_at = timezone.now()
            run.checkpoint = {"stage": "ready", "completed_years": years}
            run.save()
            return StreamingResult(total_read, total_written, years, checksum)
    except Exception as exc:
        dataset.status = DatasetVersion.Status.FAILED
        dataset.save(update_fields=["status"])
        run.status = IngestionRun.Status.FAILED
        run.error_message = str(exc)
        run.finished_at = timezone.now()
        run.save()
        raise
