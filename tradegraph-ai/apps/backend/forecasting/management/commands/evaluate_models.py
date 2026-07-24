import json

from django.core.management.base import BaseCommand

from forecasting.models import ModelVersion


class Command(BaseCommand):
    help = "Print retained model evaluation reports."

    def handle(self, *args: object, **options: object) -> None:
        reports = [
            {
                "model": str(model),
                "status": model.status,
                "dataset": model.dataset_version.version,
                "metrics": model.metrics,
            }
            for model in ModelVersion.objects.select_related("dataset_version")
        ]
        self.stdout.write(json.dumps(reports, indent=2, default=str))
