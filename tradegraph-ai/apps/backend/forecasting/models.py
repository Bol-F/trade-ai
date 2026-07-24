import uuid

from datasets.models import DatasetVersion
from django.db import models
from django.db.models import Q


class ModelVersion(models.Model):
    class Status(models.TextChoices):
        TRAINING = "training", "Training"
        CANDIDATE = "candidate", "Candidate"
        ACTIVE = "active", "Active"
        REJECTED = "rejected", "Rejected"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model_name = models.CharField(max_length=100)
    model_version = models.CharField(max_length=50)
    task_type = models.CharField(max_length=50)
    dataset_version = models.ForeignKey(DatasetVersion, on_delete=models.PROTECT)
    feature_schema_version = models.CharField(max_length=50)
    training_period = models.JSONField(default=dict)
    validation_period = models.JSONField(default=dict)
    test_period = models.JSONField(default=dict)
    algorithm = models.CharField(max_length=100)
    hyperparameters = models.JSONField(default=dict)
    metrics = models.JSONField(default=dict)
    artifact_path = models.CharField(max_length=500)
    checksum = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TRAINING)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("task_type",),
                condition=Q(status="active"),
                name="one_active_model_per_task",
            ),
            models.UniqueConstraint(
                fields=("model_name", "model_version"), name="unique_model_name_version"
            ),
        ]
        indexes = [
            models.Index(fields=("task_type", "status"), name="model_task_status_idx"),
            models.Index(
                fields=("dataset_version", "-created_at"), name="model_dataset_created_idx"
            ),
        ]
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.model_name}:{self.model_version}"
