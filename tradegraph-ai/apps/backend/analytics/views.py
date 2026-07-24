from collections.abc import Callable
from typing import Any

from django.core.cache import cache
from django.db.models import QuerySet
from rest_framework import permissions, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView
from trade.services import filtered_flows
from trade.views import _response

from analytics.cache import analytics_cache_key
from analytics.models import SavedAnalysis
from analytics.serializers import SavedAnalysisSerializer
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
        data = cache.get(key)
        if data is None:
            data = self.calculator(flows, **kwargs)
            cache.set(key, data, timeout=300)
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
