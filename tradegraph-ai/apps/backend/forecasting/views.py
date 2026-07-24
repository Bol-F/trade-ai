from django.core.cache import cache
from recommendations.services import supplier_recommendations
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from forecasting.models import ModelVersion
from forecasting.serializers import ForecastRequestSerializer, SupplierRequestSerializer
from forecasting.services import forecast


class ForecastView(APIView):
    def post(self, request: Request) -> Response:
        serializer = ForecastRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = forecast(serializer.validated_data)
        cache.set(f"forecast-request:{result['request_id']}", result, timeout=3600)
        return Response(result)


class ForecastResultView(APIView):
    def get(self, request: Request, request_id: str) -> Response:
        result = cache.get(f"forecast-request:{request_id}")
        if result is None:
            return Response(
                {
                    "error": {
                        "code": "FORECAST_NOT_FOUND",
                        "message": "Forecast not found.",
                        "details": {},
                    }
                },
                status=404,
            )
        return Response(result)


class ActiveModelsView(APIView):
    def get(self, request: Request) -> Response:
        models = ModelVersion.objects.filter(status=ModelVersion.Status.ACTIVE).select_related(
            "dataset_version"
        )
        return Response(
            [
                {
                    "model_name": model.model_name,
                    "model_version": model.model_version,
                    "task_type": model.task_type,
                    "dataset_version": model.dataset_version.version,
                    "algorithm": model.algorithm,
                    "metrics": model.metrics,
                    "activated_at": model.activated_at,
                }
                for model in models
            ]
        )


class SupplierRecommendationsView(APIView):
    def post(self, request: Request) -> Response:
        serializer = SupplierRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(supplier_recommendations(serializer.validated_data))
