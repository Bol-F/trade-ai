import hashlib
from dataclasses import dataclass
from pathlib import Path

from catalog.models import Country, Product
from datasets.lifecycle import transition_dataset
from datasets.models import DatasetVersion, IngestionRun
from django.utils import timezone

from tradegraph_data_pipeline.extract.csv import read_baci_csv
from tradegraph_data_pipeline.load.parquet import write_partitioned_parquet
from tradegraph_data_pipeline.load.postgres import load_trade_flows
from tradegraph_data_pipeline.transform.normalize import normalize_baci
from tradegraph_data_pipeline.validate.baci import PipelineValidationError, validate_baci


@dataclass(frozen=True)
class PipelineResult:
    records_read: int
    records_written: int
    checksum: str
    storage_path: str


def calculate_checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_pipeline(csv_path: Path, dataset: DatasetVersion, storage_root: Path) -> PipelineResult:
    run = IngestionRun.objects.create(dataset_version=dataset, task_name="import_baci_sample")
    try:
        transition_dataset(dataset, DatasetVersion.Status.VALIDATING)
        dataset.checksum = calculate_checksum(csv_path)
        dataset.save(update_fields=["checksum"])
        frame = read_baci_csv(csv_path)
        validation = validate_baci(
            frame,
            set(Country.objects.values_list("baci_code", flat=True)),
            set(
                Product.objects.filter(classification=dataset.classification).values_list(
                    "code", flat=True
                )
            ),
        )
        transition_dataset(dataset, DatasetVersion.Status.PROCESSING)
        normalized = normalize_baci(frame)
        destination = storage_root / dataset.version
        write_partitioned_parquet(normalized, destination)
        written = load_trade_flows(normalized, dataset)
        transition_dataset(dataset, DatasetVersion.Status.READY)
        dataset.row_count = validation.row_count
        dataset.period_start = validation.min_year
        dataset.period_end = validation.max_year
        dataset.storage_path = str(destination)
        dataset.promoted_at = timezone.now()
        dataset.metadata = {
            "synthetic": True,
            "format": "parquet",
            "partition_by": ["year"],
            "raw_path": str(csv_path),
        }
        dataset.save()
        run.status = IngestionRun.Status.SUCCEEDED
        run.records_read = validation.row_count
        run.records_written = written
        run.finished_at = timezone.now()
        run.checkpoint = {"stage": "ready"}
        run.save()
        return PipelineResult(validation.row_count, written, dataset.checksum, str(destination))
    except Exception as exc:
        if dataset.status in {
            DatasetVersion.Status.DOWNLOADING,
            DatasetVersion.Status.VALIDATING,
            DatasetVersion.Status.PROCESSING,
        }:
            transition_dataset(dataset, DatasetVersion.Status.FAILED)
        run.status = IngestionRun.Status.FAILED
        run.error_message = str(exc)
        run.finished_at = timezone.now()
        if isinstance(exc, PipelineValidationError):
            run.records_rejected = run.records_read
        run.save()
        raise
