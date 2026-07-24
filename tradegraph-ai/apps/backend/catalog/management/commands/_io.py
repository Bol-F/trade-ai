import csv
import json
from pathlib import Path
from typing import Any

from django.core.management.base import CommandError


def load_rows(path_value: str) -> list[dict[str, Any]]:
    path = Path(path_value)
    if not path.is_file():
        raise CommandError(f"File does not exist: {path}")
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as source:
            return list(csv.DictReader(source))
    if path.suffix.lower() == ".json":
        with path.open(encoding="utf-8") as source:
            data = json.load(source)
        if not isinstance(data, list) or not all(isinstance(row, dict) for row in data):
            raise CommandError("JSON import must contain an array of objects.")
        return data
    raise CommandError("Only CSV and JSON files are supported.")


def parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y"}
