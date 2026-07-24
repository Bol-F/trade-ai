import hashlib
import zipfile
from pathlib import Path

import pytest
from catalog.models import ProductClassification
from datasets.models import DatasetVersion, DataSource
from datasets.services import activate_dataset, import_baci_dataset, import_sample_dataset
from django.core.management import call_command
from trade.models import AnnualTradeFlow

pytestmark = pytest.mark.django_db


def sample_zip(tmp_path: Path) -> Path:
    source = Path(__file__).resolve().parents[3] / "data" / "sample" / "baci_sample.csv"
    destination = tmp_path / "baci.zip"
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.write(source, "BACI_HS92.csv")
    return destination


def test_streaming_zip_import_is_checksum_verified_and_idempotent(tmp_path: Path) -> None:
    import_sample_dataset()
    archive = sample_zip(tmp_path)
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    first = import_baci_dataset(str(archive), "real-test-v1", checksum)
    second = import_baci_dataset(str(archive), "real-test-v1", checksum)
    dataset = DatasetVersion.objects.get(version="real-test-v1")
    assert first.records_read == 40
    assert second.records_written == 0
    assert dataset.row_count == 40
    assert dataset.metadata["streaming"] is True
    assert AnnualTradeFlow.objects.filter(dataset_version=dataset).count() == 40
    assert dataset.ingestion_runs.latest("started_at").checkpoint["completed_years"] == list(
        range(2017, 2025)
    )


def test_streaming_import_rejects_bad_checksum(tmp_path: Path) -> None:
    import_sample_dataset()
    with pytest.raises(ValueError, match="checksum"):
        import_baci_dataset(str(sample_zip(tmp_path)), "bad-checksum", "0" * 64)


def test_atomic_activation_retains_previous_dataset_for_rollback() -> None:
    import_sample_dataset()
    previous = DatasetVersion.objects.get(version="sample-v1")
    source = DataSource.objects.get(code="BACI_SAMPLE")
    classification = ProductClassification.objects.get(code="HS", version="92")
    candidate = DatasetVersion.objects.create(
        source=source,
        version="sample-v2",
        classification=classification,
        period_start=2017,
        period_end=2024,
        status=DatasetVersion.Status.READY,
    )
    activate_dataset(candidate)
    previous.refresh_from_db()
    candidate.refresh_from_db()
    assert candidate.is_active is True
    assert previous.is_active is False
    assert previous.status == DatasetVersion.Status.READY


def test_management_validation_and_activation_commands(tmp_path: Path) -> None:
    import_sample_dataset()
    call_command("validate_dataset", dataset_version="sample-v1")
    call_command("activate_dataset", dataset_version="sample-v1")
