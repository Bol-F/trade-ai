import hashlib
import json
from collections.abc import Mapping
from typing import Any

from prometheus_client import Counter

ANALYTICS_CACHE_REQUESTS = Counter(
    "tradegraph_analytics_cache_requests_total",
    "Analytics cache lookups by endpoint and result.",
    ("endpoint", "result"),
)


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
