import hashlib
import json
from collections.abc import Mapping
from typing import Any


def analytics_cache_key(
    dataset_version: str,
    endpoint: str,
    filters: Mapping[str, Any],
    aggregation_level: str,
) -> str:
    normalized = json.dumps(
        {key: str(value) for key, value in sorted(filters.items()) if value not in (None, "")},
        separators=(",", ":"),
    )
    digest = hashlib.sha256(normalized.encode()).hexdigest()[:20]
    return f"analytics:{dataset_version}:{endpoint}:{aggregation_level}:{digest}"
