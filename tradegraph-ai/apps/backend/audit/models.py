import uuid

from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    action = models.CharField(max_length=100)
    endpoint = models.CharField(max_length=300)
    method = models.CharField(max_length=10)
    status_code = models.PositiveSmallIntegerField()
    request_id = models.UUIDField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("-created_at",), name="audit_created_idx"),
            models.Index(fields=("user", "-created_at"), name="audit_user_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.method} {self.endpoint} ({self.status_code})"
