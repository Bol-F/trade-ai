from django.core.management.base import BaseCommand, CommandError, CommandParser

from datasets.services import import_baci_dataset


class Command(BaseCommand):
    help = "Import a real BACI HS92 CSV or ZIP using year-at-a-time streaming."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--file", default="")
        parser.add_argument("--dataset-version", required=True)
        parser.add_argument("--checksum", default="")

    def handle(self, *args: object, **options: object) -> None:
        file_value = str(options["file"])
        if not file_value:
            raise CommandError("--file is required unless BACI_DOWNLOAD_URL is used explicitly.")
        result = import_baci_dataset(
            file_value, str(options["dataset_version"]), str(options["checksum"])
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Processed years {result.years_processed}; wrote {result.records_written} rows."
            )
        )
