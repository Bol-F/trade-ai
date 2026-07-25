import uuid

from django.conf import settings
from django.db import models


class SavedAnalysis(models.Model):
    class Visualization(models.TextChoices):
        EXPLORER = "explorer", "Explorer"
        MAP = "map", "Map"
        COUNTRY = "country", "Country profile"
        PRODUCT = "product", "Product profile"
        ANOMALIES = "anomalies", "Anomalies"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_analyses"
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    filters = models.JSONField(default=dict)
    visualization = models.CharField(max_length=20, choices=Visualization.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [models.Index(fields=("owner", "-updated_at"), name="analysis_owner_updated_idx")]

    def __str__(self) -> str:
        return self.title


class OwnedWorkspaceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Favorite(OwnedWorkspaceItem):
    class Kind(models.TextChoices):
        COUNTRY = "country", "Country"
        PRODUCT = "product", "Product"

    kind = models.CharField(max_length=10, choices=Kind.choices)
    code = models.CharField(max_length=12)
    label = models.CharField(max_length=200)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("owner", "kind", "code"), name="unique_owner_favorite")
        ]
        ordering = ("kind", "label")


class WatchlistItem(OwnedWorkspaceItem):
    name = models.CharField(max_length=160)
    importer = models.CharField(max_length=3)
    exporter = models.CharField(max_length=3, blank=True)
    product = models.CharField(max_length=6)
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField()
    last_viewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [models.Index(fields=("owner", "-updated_at"), name="watch_owner_updated_idx")]


class SavedComparison(OwnedWorkspaceItem):
    name = models.CharField(max_length=160)
    countries = models.JSONField(default=list)
    suppliers = models.JSONField(default=list)
    product = models.CharField(max_length=6)
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ("-updated_at",)


class AnalysisExport(OwnedWorkspaceItem):
    class Format(models.TextChoices):
        CSV = "csv", "CSV"
        JSON = "json", "JSON"
        HTML = "html", "Print-friendly HTML"
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"
        EXPIRED = "expired", "Expired"

    analysis = models.ForeignKey(SavedAnalysis, on_delete=models.CASCADE, related_name="exports")
    format = models.CharField(max_length=8, choices=Format.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    content = models.TextField(blank=True)
    expires_at = models.DateTimeField()
    error_message = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ("-created_at",)
