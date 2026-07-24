from typing import Any

from catalog.models import Product
from datasets.models import DatasetVersion
from django.db.models import Sum
from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from trade.services import filtered_flows


def _meta(dataset: DatasetVersion | None) -> dict[str, str | int | None]:
    return {
        "dataset_version": dataset.version if dataset else None,
        "source_period_end": dataset.period_end if dataset else None,
        "generated_at": timezone.now().isoformat(),
    }


def _number(value: Any) -> float | None:
    return float(value) if value is not None else None


def _response(dataset: DatasetVersion | None, data: Any) -> Response:
    return Response({"data": data, "meta": _meta(dataset)})


class TradeOverviewView(APIView):
    def get(self, request: Request) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        totals = flows.aggregate(
            trade_value_usd=Sum("trade_value_usd"), quantity_tons=Sum("quantity_tons")
        )
        partner_count = flows.values("exporter_id", "importer_id").distinct().count()
        yearly = list(
            flows.values("year").annotate(value=Sum("trade_value_usd")).order_by("-year")[:2]
        )
        yoy_change = None
        if len(yearly) == 2 and yearly[1]["value"]:
            yoy_change = float((yearly[0]["value"] - yearly[1]["value"]) / yearly[1]["value"] * 100)
        return _response(
            dataset,
            {
                "total_trade_value_usd": _number(totals["trade_value_usd"]),
                "total_quantity_tons": _number(totals["quantity_tons"]),
                "partner_count": partner_count,
                "yoy_change_percent": yoy_change,
            },
        )


class TradeTimeseriesView(APIView):
    def get(self, request: Request) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        rows = (
            flows.values("year")
            .annotate(trade_value_usd=Sum("trade_value_usd"), quantity_tons=Sum("quantity_tons"))
            .order_by("year")
        )
        data = [
            {
                "year": row["year"],
                "trade_value_usd": _number(row["trade_value_usd"]),
                "quantity_tons": _number(row["quantity_tons"]),
            }
            for row in rows
        ]
        return _response(dataset, data)


class TradePartnersView(APIView):
    def get(self, request: Request) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        use_importer = bool(request.query_params.get("exporter"))
        prefix = "importer" if use_importer else "exporter"
        rows = (
            flows.values(f"{prefix}__iso3", f"{prefix}__name")
            .annotate(trade_value_usd=Sum("trade_value_usd"), quantity_tons=Sum("quantity_tons"))
            .order_by("-trade_value_usd")[:10]
        )
        data = [
            {
                "iso3": row[f"{prefix}__iso3"],
                "name": row[f"{prefix}__name"],
                "trade_value_usd": _number(row["trade_value_usd"]),
                "quantity_tons": _number(row["quantity_tons"]),
            }
            for row in rows
        ]
        return _response(dataset, data)


class TopProductsView(APIView):
    def get(self, request: Request) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        rows = list(
            flows.values("hs6_code")
            .annotate(trade_value_usd=Sum("trade_value_usd"))
            .order_by("-trade_value_usd")[:10]
        )
        names = dict(
            Product.objects.filter(code__in=[row["hs6_code"] for row in rows]).values_list(
                "code", "name"
            )
        )
        return _response(
            dataset,
            [
                {
                    "code": row["hs6_code"],
                    "name": names.get(row["hs6_code"], ""),
                    "trade_value_usd": _number(row["trade_value_usd"]),
                }
                for row in rows
            ],
        )


class TopCountriesView(TradePartnersView):
    pass


class TradeMapView(APIView):
    def get(self, request: Request) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        try:
            limit = min(max(int(request.query_params.get("top", 25)), 1), 100)
        except ValueError:
            limit = 25
        rows = (
            flows.values(
                "exporter__iso3",
                "exporter__name",
                "exporter__latitude",
                "exporter__longitude",
                "importer__iso3",
                "importer__name",
                "importer__latitude",
                "importer__longitude",
            )
            .annotate(trade_value_usd=Sum("trade_value_usd"))
            .order_by("-trade_value_usd")[:limit]
        )
        data = [
            {
                "exporter": {
                    "iso3": row["exporter__iso3"],
                    "name": row["exporter__name"],
                    "latitude": _number(row["exporter__latitude"]),
                    "longitude": _number(row["exporter__longitude"]),
                },
                "importer": {
                    "iso3": row["importer__iso3"],
                    "name": row["importer__name"],
                    "latitude": _number(row["importer__latitude"]),
                    "longitude": _number(row["importer__longitude"]),
                },
                "trade_value_usd": _number(row["trade_value_usd"]),
            }
            for row in rows
        ]
        return _response(dataset, data)


class TradeCompareView(APIView):
    def get(self, request: Request) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        rows = (
            flows.values("year").annotate(trade_value_usd=Sum("trade_value_usd")).order_by("year")
        )
        values = [_number(row["trade_value_usd"]) or 0 for row in rows]
        years = [row["year"] for row in rows]
        from analytics.calculations import cagr, growth

        data = {
            "series": [
                {"year": row["year"], "trade_value_usd": _number(row["trade_value_usd"])}
                for row in rows
            ],
            "growth": growth(values[-1], values[-2]) if len(values) >= 2 else None,
            "cagr": cagr(values[0], values[-1], years[-1] - years[0]) if len(values) >= 2 else None,
        }
        return _response(dataset, data)
