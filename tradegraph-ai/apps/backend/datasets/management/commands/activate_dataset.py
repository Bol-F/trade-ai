from django.core.management.base import BaseCommand, CommandError, CommandParser

from datasets.models import DatasetVersion
from datasets.services import activate_dataset


class Command(BaseCommand):
    help = "Atomically activate a ready dataset and retain the previous version."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--dataset-version", required=True)

    def handle(self, *args: object, **options: object) -> None:
        try:
            dataset = DatasetVersion.objects.get(version=options["dataset_version"])
        except DatasetVersion.DoesNotExist as exc:
            raise CommandError("Dataset version not found.") from exc
        activate_dataset(dataset)
        self.stdout.write(self.style.SUCCESS(f"Activated {dataset.version}."))
