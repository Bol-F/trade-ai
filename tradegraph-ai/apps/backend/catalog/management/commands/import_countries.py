from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from catalog.management.commands._io import load_rows, parse_bool
from catalog.models import Country


class Command(BaseCommand):
    help = "Import or update countries from a UTF-8 CSV or JSON file."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("path")

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        rows = load_rows(options["path"])
        for row in rows:
            iso3 = str(row["iso3"]).strip().upper()
            Country.objects.update_or_create(
                iso3=iso3,
                defaults={
                    "baci_code": str(row["baci_code"]).strip(),
                    "m49_code": str(row["m49_code"]).strip().zfill(3),
                    "iso2": str(row["iso2"]).strip().upper(),
                    "name": str(row["name"]).strip(),
                    "region": str(row.get("region", "")).strip(),
                    "subregion": str(row.get("subregion", "")).strip(),
                    "latitude": row.get("latitude") or None,
                    "longitude": row.get("longitude") or None,
                    "landlocked": parse_bool(row.get("landlocked", False)),
                    "is_active": parse_bool(row.get("is_active", True)),
                },
            )
        self.stdout.write(self.style.SUCCESS(f"Imported {len(rows)} countries."))
