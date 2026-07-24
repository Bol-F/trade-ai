from django.urls import path

from forecasting.views import (
    ActiveModelsView,
    ForecastResultView,
    ForecastView,
    SupplierRecommendationsView,
)

urlpatterns = [
    path("ml/forecast", ForecastView.as_view(), name="ml-forecast"),
    path("ml/forecast/<uuid:request_id>", ForecastResultView.as_view(), name="ml-forecast-result"),
    path("ml/models/active", ActiveModelsView.as_view(), name="ml-active-models"),
    path(
        "ml/supplier-recommendations",
        SupplierRecommendationsView.as_view(),
        name="ml-supplier-recommendations",
    ),
]
