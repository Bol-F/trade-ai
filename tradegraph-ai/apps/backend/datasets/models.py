import uuid

from catalog.models import ProductClassification
from django.db import models
from django.db.models import Q


class DataSource(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=150)
    homepage = models.URLField(blank=True)
    license_name = models.CharField(max_length=150, blank=True)
    requires_api_key = models.BooleanField(default=False)
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("code",)

    def __str__(self) -> str:
        return self.name


class DatasetVersion(models.Model):
    class Status(models.TextChoices):
        DISCOVERED = "discovered", "Discovered"
        DOWNLOADING = "downloading", "Downloading"
        DOWNLOADED = "downloaded", "Downloaded"
        VALIDATING = "validating", "Validating"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(DataSource, on_delete=models.PROTECT, related_name="versions")
    version = models.CharField(max_length=64)
    classification = models.ForeignKey(ProductClassification, on_delete=models.PROTECT)
    period_start = models.PositiveSmallIntegerField()
    period_end = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DISCOVERED)
    checksum = models.CharField(max_length=64, blank=True)
    row_count = models.PositiveBigIntegerField(default=0)
    storage_path = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    promoted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("source", "version", "classification"),
                name="unique_source_version_classification",
            ),
            models.UniqueConstraint(
                fields=("source", "classification"),
                condition=Q(is_active=True),
                name="one_active_dataset_per_source_classification",
            ),
        ]
        indexes = [
            models.Index(
                fields=("source", "status", "-period_end"), name="dataset_source_status_idx"
            ),
            models.Index(fields=("is_active", "-promoted_at"), name="dataset_active_promoted_idx"),
        ]
        ordering = ("-period_end", "-created_at")

    def __str__(self) -> str:
        return f"{self.source.code} {self.version}"


class IngestionRun(models.Model):
    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset_version = models.ForeignKey(
        DatasetVersion, on_delete=models.CASCADE, related_name="ingestion_runs"
    )
    task_name = models.CharField(max_length=150)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.RUNNING)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    records_read = models.PositiveBigIntegerField(default=0)
    records_written = models.PositiveBigIntegerField(default=0)
    records_rejected = models.PositiveBigIntegerField(default=0)
    error_message = models.TextField(blank=True)
    checkpoint = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-started_at",)

    def __str__(self) -> str:
        return f"{self.task_name} ({self.status})"
