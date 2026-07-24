from typing import Any

from django.core.management.base import BaseCommand

from datasets.services import import_sample_dataset


class Command(BaseCommand):
    help = "Import the checked-in synthetic BACI-compatible sample dataset."

    def handle(self, *args: Any, **options: Any) -> None:
        result = import_sample_dataset()
        self.stdout.write(
            self.style.SUCCESS(
                f"Sample ready: {result.records_read} read, {result.records_written} written."
            )
        )
