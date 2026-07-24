import json

from django.core.management.base import BaseCommand, CommandError, CommandParser

from datasets.models import DatasetVersion
from datasets.services import validate_dataset


class Command(BaseCommand):
    help = "Validate a processed dataset version."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--dataset-version", required=True)

    def handle(self, *args: object, **options: object) -> None:
        try:
            dataset = DatasetVersion.objects.get(version=options["dataset_version"])
        except DatasetVersion.DoesNotExist as exc:
            raise CommandError("Dataset version not found.") from exc
        report = validate_dataset(dataset)
        self.stdout.write(json.dumps(report, indent=2))
        if not report["valid"]:
            raise CommandError("Dataset validation failed.")
