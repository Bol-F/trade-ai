from collections.abc import Callable
from datetime import timedelta
from typing import Any

from django.core.cache import cache
from django.db.models import QuerySet
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView
from trade.services import filtered_flows
from trade.views import _response

from analytics.cache import ANALYTICS_CACHE_REQUESTS, analytics_cache_key
from analytics.exports import render_analysis_export
from analytics.models import AnalysisExport, Favorite, SavedAnalysis, SavedComparison, WatchlistItem
from analytics.serializers import (
    AnalysisExportSerializer,
    FavoriteSerializer,
    SavedAnalysisSerializer,
    SavedComparisonSerializer,
    WatchlistItemSerializer,
)
from analytics.services import (
    anomaly_data,
    concentration_data,
    country_profile,
    exposure_data,
    product_profile,
)


class CachedAnalyticsView(APIView):
    endpoint = ""
    aggregation_level = "annual"
    calculator: Callable[..., Any]

    def get(self, request: Request, **kwargs: str) -> Response:
        dataset, flows = filtered_flows(request.query_params)
        if dataset is None:
            return _response(None, self.calculator(flows, **kwargs))
        filters = {**request.query_params.dict(), **kwargs}
        key = analytics_cache_key(dataset.version, self.endpoint, filters, self.aggregation_level)
        try:
            data = cache.get(key)
        except Exception:
            ANALYTICS_CACHE_REQUESTS.labels(endpoint=self.endpoint, result="error").inc()
            data = None
        if data is None:
            ANALYTICS_CACHE_REQUESTS.labels(endpoint=self.endpoint, result="miss").inc()
            data = self.calculator(flows, **kwargs)
            try:
                cache.set(key, data, timeout=300)
            except Exception:
                ANALYTICS_CACHE_REQUESTS.labels(endpoint=self.endpoint, result="error").inc()
        else:
            ANALYTICS_CACHE_REQUESTS.labels(endpoint=self.endpoint, result="hit").inc()
        return _response(dataset, data)


class ExposureView(CachedAnalyticsView):
    endpoint = "exposure"
    calculator = staticmethod(exposure_data)


class ConcentrationView(CachedAnalyticsView):
    endpoint = "concentration"
    calculator = staticmethod(concentration_data)


class AnomaliesView(CachedAnalyticsView):
    endpoint = "anomalies"
    calculator = staticmethod(anomaly_data)


class CountryProfileView(CachedAnalyticsView):
    endpoint = "country-profile"
    aggregation_level = "country"
    calculator = staticmethod(country_profile)


class ProductProfileView(CachedAnalyticsView):
    endpoint = "product-profile"
    aggregation_level = "hs2"
    calculator = staticmethod(product_profile)


class SavedAnalysisViewSet(viewsets.ModelViewSet[SavedAnalysis]):
    serializer_class = SavedAnalysisSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self) -> QuerySet[SavedAnalysis]:
        return SavedAnalysis.objects.filter(owner_id=self.request.user.pk)

    def perform_create(self, serializer: BaseSerializer[SavedAnalysis]) -> None:
        serializer.save(owner=self.request.user)


class OwnerScopedViewSet(viewsets.ModelViewSet[Any]):
    permission_classes = (permissions.IsAuthenticated,)
    model: type[Any]

    def get_queryset(self) -> QuerySet[Any]:
        return self.model.objects.filter(owner_id=self.request.user.pk)

    def perform_create(self, serializer: BaseSerializer[Any]) -> None:
        serializer.save(owner=self.request.user)


class FavoriteViewSet(OwnerScopedViewSet):
    model = Favorite
    serializer_class = FavoriteSerializer


class WatchlistViewSet(OwnerScopedViewSet):
    model = WatchlistItem
    serializer_class = WatchlistItemSerializer

    def retrieve(self, request: Request, *args: object, **kwargs: object) -> Response:
        item = self.get_object()
        item.last_viewed_at = timezone.now()
        item.save(update_fields=["last_viewed_at"])
        return Response(self.get_serializer(item).data)


class SavedComparisonViewSet(OwnerScopedViewSet):
    model = SavedComparison
    serializer_class = SavedComparisonSerializer


class AnalysisExportViewSet(OwnerScopedViewSet):
    model = AnalysisExport
    serializer_class = AnalysisExportSerializer

    def perform_create(self, serializer: BaseSerializer[AnalysisExport]) -> None:
        analysis = serializer.validated_data["analysis"]
        if analysis.owner_id != self.request.user.pk:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only export your own analyses.")
        format_name = serializer.validated_data["format"]
        export = serializer.save(
            owner=self.request.user,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        try:
            export.content = render_analysis_export(analysis, format_name)
            export.status = AnalysisExport.Status.READY
        except Exception:
            export.status = AnalysisExport.Status.FAILED
            export.error_message = "The export could not be generated."
        export.save(update_fields=["content", "status", "error_message"])

    @action(detail=True, methods=["get"])
    def download(self, request: Request, pk: str | None = None) -> HttpResponse:
        export = self.get_object()
        if export.expires_at <= timezone.now():
            export.status = AnalysisExport.Status.EXPIRED
            export.save(update_fields=["status"])
            return HttpResponse("Export expired.", status=410)
        if export.status != AnalysisExport.Status.READY:
            return HttpResponse("Export is not ready.", status=409)
        content_types = {"csv": "text/csv", "json": "application/json", "html": "text/html"}
        response = HttpResponse(
            export.content, content_type=f"{content_types[export.format]}; charset=utf-8"
        )
        response["Content-Disposition"] = (
            f'attachment; filename="tradegraph-analysis.{export.format}"'
        )
        response["Cache-Control"] = "private, no-store"
        return response


class WorkspaceView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        owner = request.user
        return Response(
            {
                "saved_analyses": SavedAnalysisSerializer(
                    SavedAnalysis.objects.filter(owner=owner)[:10], many=True
                ).data,
                "recent_analyses": SavedAnalysisSerializer(
                    SavedAnalysis.objects.filter(owner=owner).order_by("-updated_at")[:5], many=True
                ).data,
                "favorites": FavoriteSerializer(
                    Favorite.objects.filter(owner=owner), many=True
                ).data,
                "watchlist_items": WatchlistItemSerializer(
                    WatchlistItem.objects.filter(owner=owner), many=True
                ).data,
                "saved_comparisons": SavedComparisonSerializer(
                    SavedComparison.objects.filter(owner=owner), many=True
                ).data,
                "recent_exports": AnalysisExportSerializer(
                    AnalysisExport.objects.filter(owner=owner)[:10], many=True
                ).data,
            }
        )
