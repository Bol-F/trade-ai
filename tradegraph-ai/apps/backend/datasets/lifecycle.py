from __future__ import annotations

import uuid
from pathlib import Path

from audit.models import AuditEvent
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from datasets.models import DatasetVersion

ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    DatasetVersion.Status.DISCOVERED: frozenset(
        {DatasetVersion.Status.DOWNLOADING, DatasetVersion.Status.VALIDATING}
    ),
    DatasetVersion.Status.DOWNLOADING: frozenset(
        {DatasetVersion.Status.DOWNLOADED, DatasetVersion.Status.FAILED}
    ),
    DatasetVersion.Status.DOWNLOADED: frozenset(
        {DatasetVersion.Status.VALIDATING, DatasetVersion.Status.FAILED}
    ),
    DatasetVersion.Status.VALIDATING: frozenset(
        {DatasetVersion.Status.PROCESSING, DatasetVersion.Status.FAILED}
    ),
    DatasetVersion.Status.PROCESSING: frozenset(
        {DatasetVersion.Status.READY, DatasetVersion.Status.FAILED}
    ),
    DatasetVersion.Status.READY: frozenset({DatasetVersion.Status.ARCHIVED}),
    # A failed import may be explicitly retried, but it must pass validation again.
    DatasetVersion.Status.FAILED: frozenset({DatasetVersion.Status.VALIDATING}),
    DatasetVersion.Status.ARCHIVED: frozenset(),
}


class InvalidDatasetTransition(ValueError):
    pass


@transaction.atomic
def transition_dataset(dataset: DatasetVersion, target: str) -> DatasetVersion:
    locked = DatasetVersion.objects.select_for_update().get(pk=dataset.pk)
    if target == locked.status:
        return locked
    if target not in ALLOWED_TRANSITIONS.get(locked.status, frozenset()):
        raise InvalidDatasetTransition(
            f"Dataset cannot transition from {locked.status} to {target}."
        )
    locked.status = target
    locked.save(update_fields=["status"])
    dataset.status = target
    return locked


@transaction.atomic
def activate_ready_dataset(dataset: DatasetVersion) -> None:
    locked = DatasetVersion.objects.select_for_update().select_related(
        "source", "classification"
    ).get(pk=dataset.pk)
    if locked.status != DatasetVersion.Status.READY:
        raise InvalidDatasetTransition("Only a ready dataset can be activated.")
    if (
        not locked.checksum
        or locked.row_count <= 0
        or locked.trade_flows.count() != locked.row_count
        or not locked.storage_path
        or not Path(locked.storage_path).is_dir()
    ):
        raise InvalidDatasetTransition(
            "A dataset must be validated and non-empty before activation."
        )
    DatasetVersion.objects.select_for_update().filter(
        source=locked.source,
        classification=locked.classification,
        is_active=True,
    ).exclude(pk=locked.pk).update(is_active=False)
    locked.is_active = True
    locked.promoted_at = timezone.now()
    locked.save(update_fields=["is_active", "promoted_at"])
    AuditEvent.objects.create(
        action="dataset_activated",
        endpoint="datasets.lifecycle",
        method="SYSTEM",
        status_code=200,
        request_id=uuid.uuid4(),
        metadata={
            "dataset_id": str(locked.pk),
            "dataset_version": locked.version,
            "source": locked.source.code,
            "classification": str(locked.classification),
        },
    )
    # Analytical keys are versioned, but clearing reclaims obsolete entries and
    # prevents non-versioned metadata caches from surviving promotion.
    transaction.on_commit(cache.clear)
    dataset.is_active = True
    dataset.promoted_at = locked.promoted_at
