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
DEFAULT_DOWNLOAD_HOSTS = {"www.cepii.fr", "cepii.fr"}
MAX_DOWNLOAD_BYTES = 2 * 1024 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 8 * 1024 * 1024 * 1024


def validate_download_url(value: str, allowed_hosts: set[str] | None = None) -> None:
    parsed = urlparse(value)
    hosts = allowed_hosts or DEFAULT_DOWNLOAD_HOSTS
    if parsed.scheme != "https" or not parsed.hostname or parsed.hostname.lower() not in hosts:
        raise ValueError("BACI download URL must use HTTPS and an allowlisted host.")
    if parsed.username or parsed.password or parsed.port not in {None, 443}:
        raise ValueError("BACI download URL must not contain credentials or a non-HTTPS port.")


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
            validate_download_url(value)
            filename = Path(urlparse(value).path).name
            if not filename:
                raise ValueError("BACI download URL must include a filename.")
            local = temporary / filename
            # URL scheme, host, credentials, and port are strictly allowlisted above.
            with urllib.request.urlopen(value, timeout=60) as response, local.open("wb") as target:  # noqa: S310
                content_length = int(response.headers.get("Content-Length", "0") or 0)
                if content_length > MAX_DOWNLOAD_BYTES:
                    raise ValueError("BACI download exceeds the configured size limit.")
                copied = 0
                while chunk := response.read(1024 * 1024):
                    copied += len(chunk)
                    if copied > MAX_DOWNLOAD_BYTES:
                        raise ValueError("BACI download exceeds the configured size limit.")
                    target.write(chunk)
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
            if members[0].file_size > MAX_UNCOMPRESSED_BYTES:
                raise ValueError("BACI ZIP expands beyond the configured size limit.")
            if members[0].compress_size and members[0].file_size / members[0].compress_size > 200:
                raise ValueError("BACI ZIP compression ratio is unsafe.")
            extracted = temporary / "baci.csv"
            with archive.open(members[0]) as source_file, extracted.open("wb") as target:
                shutil.copyfileobj(source_file, target, length=1024 * 1024)
            yield extracted
    finally:
        shutil.rmtree(temporary, ignore_errors=True)
