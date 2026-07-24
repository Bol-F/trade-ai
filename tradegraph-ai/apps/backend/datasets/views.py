from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from datasets.models import DatasetVersion, DataSource
from datasets.serializers import DataSourceSerializer


def dataset_meta(dataset: DatasetVersion | None) -> dict[str, str | int | None]:
    return {
        "dataset_version": dataset.version if dataset else None,
        "source_period_end": dataset.period_end if dataset else None,
        "generated_at": timezone.now().isoformat(),
    }


class DataSourceListView(APIView):
    def get(self, request: Request) -> Response:
        dataset = DatasetVersion.objects.filter(status=DatasetVersion.Status.READY).first()
        sources = DataSource.objects.filter(is_enabled=True)
        return Response(
            {"data": DataSourceSerializer(sources, many=True).data, "meta": dataset_meta(dataset)}
        )


class DataFreshnessView(APIView):
    def get(self, request: Request) -> Response:
        dataset = DatasetVersion.objects.filter(status=DatasetVersion.Status.READY).first()
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
