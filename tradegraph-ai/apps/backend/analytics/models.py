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
