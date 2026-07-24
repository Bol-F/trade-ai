from catalog.models import ProductClassification
from django.conf import settings
from django.core.management import call_command
from tradegraph_data_pipeline import PipelineResult, run_pipeline

from datasets.models import DatasetVersion, DataSource


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
    return run_pipeline(
        sample_dir / "baci_sample.csv",
        dataset,
        settings.BASE_DIR.parents[1] / "var" / "data",
    )
