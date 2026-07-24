from typing import Any

from datasets.models import DatasetVersion
from django.db.models import QuerySet

from trade.models import AnnualTradeFlow


def latest_ready_dataset() -> DatasetVersion | None:
    return (
        DatasetVersion.objects.filter(status=DatasetVersion.Status.READY)
        .select_related("source")
        .first()
    )


def filtered_flows(params: Any) -> tuple[DatasetVersion | None, QuerySet[AnnualTradeFlow]]:
    dataset = latest_ready_dataset()
    if dataset is None:
        return None, AnnualTradeFlow.objects.none()
    queryset = AnnualTradeFlow.objects.filter(dataset_version=dataset)
    if value := params.get("importer"):
        queryset = queryset.filter(importer__iso3__iexact=value)
    if value := params.get("exporter"):
        queryset = queryset.filter(exporter__iso3__iexact=value)
    if value := params.get("product"):
        value = str(value)
        field = {2: "hs2_code", 4: "hs4_code", 6: "hs6_code"}.get(len(value))
        if field:
            queryset = queryset.filter(**{field: value})
    if value := params.get("start_year"):
        queryset = queryset.filter(year__gte=int(value))
    if value := params.get("end_year"):
        queryset = queryset.filter(year__lte=int(value))
    return dataset, queryset
