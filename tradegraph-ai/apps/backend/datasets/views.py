from accounts.permissions import IsAdminRole
from django.core.cache import cache
from django.utils import timezone
from forecasting.models import ModelVersion
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from datasets.models import DatasetVersion, DataSource, IngestionRun
from datasets.serializers import DataSourceSerializer


def dataset_meta(dataset: DatasetVersion | None) -> dict[str, str | int | None]:
    return {
        "dataset_version": dataset.version if dataset else None,
        "source_period_end": dataset.period_end if dataset else None,
        "generated_at": timezone.now().isoformat(),
    }


class DataSourceListView(APIView):
    def get(self, request: Request) -> Response:
        dataset = (
            DatasetVersion.objects.filter(status=DatasetVersion.Status.READY, is_active=True)
            .select_related("source")
            .first()
        )
        sources = DataSource.objects.filter(is_enabled=True)
        serialized = DataSourceSerializer(sources, many=True).data
        latest_by_source = {
            item.source_id: item
            for item in DatasetVersion.objects.filter(is_active=True).select_related(
                "classification"
            )
        }
        current_year = timezone.now().year
        for source_data, source in zip(serialized, sources, strict=True):
            version = latest_by_source.get(source.pk)
            label = "Unknown"
            if version:
                if version.row_count == 0 or version.status != DatasetVersion.Status.READY:
                    label = "Incomplete"
                elif version.period_end >= current_year - 1:
                    label = "Current"
                elif version.period_end >= current_year - 2:
                    label = "Delayed"
                else:
                    label = "Stale"
            source_data["active_dataset"] = (
                {
                    "version": version.version,
                    "classification": (
                        f"{version.classification.name} {version.classification.version}"
                    ),
                    "imported_at": version.created_at,
                    "period_start": version.period_start,
                    "period_end": version.period_end,
                    "row_count": version.row_count,
                    "validation_status": version.status,
                    "freshness_label": label,
                    "known_limitations": version.metadata.get("known_limitations", []),
                    "attribution": source.license_name or source.name,
                }
                if version
                else None
            )
        return Response({"data": serialized, "meta": dataset_meta(dataset)})


class DataFreshnessView(APIView):
    def get(self, request: Request) -> Response:
        dataset = (
            DatasetVersion.objects.filter(status=DatasetVersion.Status.READY, is_active=True)
            .select_related("source")
            .first()
        )
        data = None
        if dataset:
            data = {
                "source": dataset.source.code,
                "version": dataset.version,
                "period_start": dataset.period_start,
                "period_end": dataset.period_end,
                "row_count": dataset.row_count,
                "promoted_at": dataset.promoted_at,
                "checksum": dataset.checksum,
                "synthetic": bool(dataset.metadata.get("synthetic")),
            }
        return Response({"data": data, "meta": dataset_meta(dataset)})


class AdminDataHealthView(APIView):
    permission_classes = (IsAdminRole,)

    def get(self, request: Request) -> Response:
        datasets = DatasetVersion.objects.select_related("source", "classification").all()
        active = datasets.filter(is_active=True).first()
        try:
            cache.set("health:data-health", "ok", timeout=10)
            cache_ok = cache.get("health:data-health") == "ok"
            cache.delete("health:data-health")
        except Exception:
            cache_ok = False
        return Response(
            {
                "sources": list(
                    DataSource.objects.values(
                        "code", "name", "is_enabled", "requires_api_key", "updated_at"
                    )
                ),
                "active_dataset": (
                    {
                        "version": active.version,
                        "source": active.source.code,
                        "row_count": active.row_count,
                        "period_start": active.period_start,
                        "period_end": active.period_end,
                        "promoted_at": active.promoted_at,
                    }
                    if active
                    else None
                ),
                "versions": [
                    {
                        "version": dataset.version,
                        "source": dataset.source.code,
                        "status": dataset.status,
                        "is_active": dataset.is_active,
                        "row_count": dataset.row_count,
                        "period_start": dataset.period_start,
                        "period_end": dataset.period_end,
                    }
                    for dataset in datasets[:50]
                ],
                "ingestion_runs": list(
                    IngestionRun.objects.values(
                        "id",
                        "dataset_version__version",
                        "task_name",
                        "status",
                        "records_read",
                        "records_written",
                        "records_rejected",
                        "error_message",
                        "started_at",
                        "finished_at",
                    )[:50]
                ),
                "failures": IngestionRun.objects.filter(status=IngestionRun.Status.FAILED).count(),
                "models": list(
                    ModelVersion.objects.values(
                        "model_name",
                        "model_version",
                        "task_type",
                        "status",
                        "dataset_version__version",
                        "created_at",
                        "activated_at",
                    )[:50]
                ),
                "active_models": ModelVersion.objects.filter(
                    status=ModelVersion.Status.ACTIVE
                ).count(),
                "data_freshness": active.period_end if active else None,
                "cache_status": "ok" if cache_ok else "unavailable",
            }
        )
