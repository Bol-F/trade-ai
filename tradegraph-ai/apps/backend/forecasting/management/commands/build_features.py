from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from forecasting.services import build_feature_frame


class Command(BaseCommand):
    help = "Build leakage-safe forecast features for the active dataset."

    def handle(self, *args: object, **options: object) -> None:
        frame = build_feature_frame()
        if frame.is_empty():
            raise ValueError("No ready dataset.")
        path = Path(settings.BASE_DIR).parent.parent / "artifacts" / "ml" / "features.parquet"
        path.parent.mkdir(parents=True, exist_ok=True)
        frame.write_parquet(path)
        self.stdout.write(self.style.SUCCESS(f"Wrote {len(frame)} rows to {path}"))
