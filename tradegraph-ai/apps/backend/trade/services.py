import re
from typing import Any

from datasets.models import DatasetVersion
from django.db.models import QuerySet
from rest_framework.exceptions import ValidationError

from trade.models import AnnualTradeFlow


def latest_ready_dataset() -> DatasetVersion | None:
    return (
        DatasetVersion.objects.filter(status=DatasetVersion.Status.READY, is_active=True)
        .select_related("source")
        .first()
    )


def filtered_flows(params: Any) -> tuple[DatasetVersion | None, QuerySet[AnnualTradeFlow]]:
    dataset = latest_ready_dataset()
    if dataset is None:
        return None, AnnualTradeFlow.objects.none()
    requested_version = params.get("dataset_version")
    if requested_version and requested_version != dataset.version:
        raise ValidationError(
            {"dataset_version": "Only the active ready dataset may be queried."}
        )
    queryset = AnnualTradeFlow.objects.filter(dataset_version=dataset)
    if value := params.get("importer"):
        if not re.fullmatch(r"[A-Za-z]{3}", str(value)):
            raise ValidationError({"importer": "Importer must be a three-letter ISO code."})
        queryset = queryset.filter(importer__iso3__iexact=value)
    if value := params.get("exporter"):
        if not re.fullmatch(r"[A-Za-z]{3}", str(value)):
            raise ValidationError({"exporter": "Exporter must be a three-letter ISO code."})
        queryset = queryset.filter(exporter__iso3__iexact=value)
    if value := params.get("product"):
        value = str(value)
        field = {2: "hs2_code", 4: "hs4_code", 6: "hs6_code"}.get(len(value))
        if field is None or not value.isdigit():
            raise ValidationError({"product": "Product must be a 2, 4, or 6 digit HS code."})
        queryset = queryset.filter(**{field: value})
    direction = params.get("direction")
    if direction:
        if direction not in {"imports", "exports"}:
            raise ValidationError({"direction": "Direction must be imports or exports."})
        if direction == "imports" and not params.get("importer"):
            raise ValidationError({"direction": "Import direction requires an importer."})
        if direction == "exports" and not params.get("exporter"):
            raise ValidationError({"direction": "Export direction requires an exporter."})
    if params.get("aggregation_level") not in (None, "", "annual"):
        raise ValidationError({"aggregation_level": "Only annual aggregation is supported."})
    try:
        start_year = int(params["start_year"]) if params.get("start_year") else None
        end_year = int(params["end_year"]) if params.get("end_year") else None
    except (TypeError, ValueError) as exc:
        raise ValidationError({"year": "Years must be integers."}) from exc
    effective_start = start_year if start_year is not None else dataset.period_start
    effective_end = end_year if end_year is not None else dataset.period_end
    if effective_start is not None and effective_end is not None:
        if effective_start > effective_end:
            raise ValidationError({"year": "start_year must not exceed end_year."})
        if effective_end - effective_start > 50:
            raise ValidationError({"year": "Date ranges may not exceed 50 years."})
    if start_year is not None:
        queryset = queryset.filter(year__gte=start_year)
    if end_year is not None:
        queryset = queryset.filter(year__lte=end_year)
    return dataset, queryset
