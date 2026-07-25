from pathlib import Path

from catalog.models import ProductClassification
from django.conf import settings
from django.core.management import call_command
from django.utils import timezone
from tradegraph_data_pipeline import PipelineResult, run_pipeline
from tradegraph_data_pipeline.streaming import StreamingResult, run_streaming_pipeline

from datasets.lifecycle import activate_ready_dataset
from datasets.models import DatasetVersion, DataSource, IngestionRun


def import_sample_dataset() -> PipelineResult:
    sample_dir = settings.BASE_DIR.parents[1] / "data" / "sample"
    call_command("import_countries", str(sample_dir / "countries.csv"))
    call_command("import_products", str(sample_dir / "products.csv"))
    source, _ = DataSource.objects.get_or_create(
        code="BACI_SAMPLE",
        defaults={
            "name": "Synthetic BACI-compatible sample",
            "homepage": "",
            "license_name": "Test data only",
            "requires_api_key": False,
            "is_enabled": True,
        },
    )
    classification = ProductClassification.objects.get(code="HS", version="92")
    dataset, _ = DatasetVersion.objects.get_or_create(
        source=source,
        version="sample-v1",
        classification=classification,
        defaults={"period_start": 2017, "period_end": 2024},
    )
    if dataset.status == DatasetVersion.Status.READY:
        IngestionRun.objects.create(
            dataset_version=dataset,
            task_name="import_baci_sample",
            status=IngestionRun.Status.SUCCEEDED,
            records_read=dataset.row_count,
            records_written=0,
            finished_at=timezone.now(),
            checkpoint={"stage": "already_ready"},
        )
        activate_dataset(dataset)
        return PipelineResult(
            records_read=dataset.row_count,
            records_written=0,
            checksum=dataset.checksum,
            storage_path=dataset.storage_path,
        )
    result = run_pipeline(
        sample_dir / "baci_sample.csv",
        dataset,
        settings.BASE_DIR.parents[1] / "var" / "data",
    )
    activate_dataset(dataset)
    return result


def import_baci_dataset(
    source_path: str, version: str, expected_checksum: str = ""
) -> StreamingResult:
    source, _ = DataSource.objects.get_or_create(
        code="BACI",
        defaults={
            "name": "BACI International Trade Database",
            "homepage": "https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37",
            "license_name": "CEPII BACI terms",
            "requires_api_key": False,
            "is_enabled": True,
        },
    )
    classification = ProductClassification.objects.get(code="HS", version="92")
    dataset, _ = DatasetVersion.objects.get_or_create(
        source=source,
        version=version,
        classification=classification,
        defaults={"period_start": 1900, "period_end": 1900},
    )
    dataset.metadata = {
        **dataset.metadata,
        "raw_path": source_path,
        "expected_checksum": expected_checksum,
        "synthetic": False,
    }
    dataset.save(update_fields=["metadata"])
    if dataset.status == DatasetVersion.Status.READY:
        if expected_checksum and dataset.checksum.lower() != expected_checksum.lower():
            raise ValueError("BACI checksum verification failed.")
        IngestionRun.objects.create(
            dataset_version=dataset,
            task_name="import_baci",
            status=IngestionRun.Status.SUCCEEDED,
            records_read=0,
            records_written=0,
            finished_at=timezone.now(),
            checkpoint={
                "stage": "ready",
                "completed_years": list(range(dataset.period_start, dataset.period_end + 1)),
            },
        )
        activate_dataset(dataset)
        return StreamingResult(
            records_read=0,
            records_written=0,
            years_processed=list(range(dataset.period_start, dataset.period_end + 1)),
            checksum=dataset.checksum,
        )
    return run_streaming_pipeline(
        source_path,
        dataset,
        settings.BASE_DIR.parents[1] / "var" / "data",
        expected_checksum=expected_checksum,
        download_url=getattr(settings, "BACI_DOWNLOAD_URL", ""),
    )


def activate_dataset(dataset: DatasetVersion) -> None:
    activate_ready_dataset(dataset)


def validate_dataset(dataset: DatasetVersion) -> dict[str, int | str | bool]:
    database_rows = dataset.trade_flows.count()
    storage_exists = bool(dataset.storage_path and Path(dataset.storage_path).is_dir())
    valid = (
        dataset.status == DatasetVersion.Status.READY
        and database_rows == dataset.row_count
        and storage_exists
        and bool(dataset.checksum)
    )
    return {
        "version": dataset.version,
        "valid": valid,
        "database_rows": database_rows,
        "expected_rows": dataset.row_count,
        "storage_exists": storage_exists,
    }
