from __future__ import annotations

import shutil
import tempfile
import urllib.request
import zipfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlparse

import polars as pl

SCHEMA = {
    "t": pl.Int64,
    "i": pl.String,
    "j": pl.String,
    "k": pl.String,
    "v": pl.Float64,
    "q": pl.Float64,
}


def scan_baci_csv(path: Path) -> pl.LazyFrame:
    return pl.scan_csv(
        path,
        schema_overrides=SCHEMA,
        null_values=["", "NA", "null"],
        low_memory=True,
    )


@contextmanager
def materialized_csv(source: str, download_url: str | None = None) -> Iterator[Path]:
    temporary = Path(tempfile.mkdtemp(prefix="tradegraph-baci-"))
    try:
        value = source or download_url
        if not value:
            raise ValueError("A BACI file path or configured download URL is required.")
        local = Path(value)
        if value.startswith(("https://", "http://")):
            local = temporary / Path(urlparse(value).path).name
            with urllib.request.urlopen(value, timeout=60) as response, local.open("wb") as target:
                shutil.copyfileobj(response, target, length=1024 * 1024)
        if not local.is_file():
            raise FileNotFoundError(local)
        if local.suffix.lower() != ".zip":
            yield local
            return
        with zipfile.ZipFile(local) as archive:
            members = [
                member for member in archive.infolist() if member.filename.lower().endswith(".csv")
            ]
            if len(members) != 1:
                raise ValueError("BACI ZIP must contain exactly one CSV file.")
            extracted = temporary / "baci.csv"
            with archive.open(members[0]) as source_file, extracted.open("wb") as target:
                shutil.copyfileobj(source_file, target, length=1024 * 1024)
            yield extracted
    finally:
        shutil.rmtree(temporary, ignore_errors=True)
