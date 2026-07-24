from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from catalog.management.commands._io import load_rows, parse_bool
from catalog.models import Product, ProductClassification


class Command(BaseCommand):
    help = "Import or update HS product metadata from a UTF-8 CSV or JSON file."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("path")
        parser.add_argument("--classification", default="HS")
        parser.add_argument("--classification-version", default="92")
        parser.add_argument("--name", default="Harmonized System")

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        classification, _ = ProductClassification.objects.get_or_create(
            code=options["classification"],
            version=options["classification_version"],
            defaults={"name": options["name"], "description": "Product classification metadata."},
        )
        rows = load_rows(options["path"])
        for row in rows:
            code = str(row["code"]).strip()
            level = int(row.get("level") or len(code))
            if level not in Product.Level.values:
                raise ValueError(f"Unsupported product level {level} for code {code}.")
            Product.objects.update_or_create(
                classification=classification,
                code=code,
                defaults={
                    "level": level,
                    "parent_code": str(row.get("parent_code", "")).strip(),
                    "name": str(row["name"]).strip(),
                    "description": str(row.get("description", "")).strip(),
                    "is_active": parse_bool(row.get("is_active", True)),
                },
            )
        self.stdout.write(self.style.SUCCESS(f"Imported {len(rows)} products."))
