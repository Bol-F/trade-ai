from django.urls import path
from rest_framework.routers import SimpleRouter

from analytics.views import (
    AnomaliesView,
    ConcentrationView,
    CountryProfileView,
    ExposureView,
    ProductProfileView,
    SavedAnalysisViewSet,
)

router = SimpleRouter(trailing_slash=False)
router.register("saved-analyses", SavedAnalysisViewSet, basename="saved-analysis")

urlpatterns = [
    path("analytics/exposure", ExposureView.as_view(), name="analytics-exposure"),
    path("analytics/concentration", ConcentrationView.as_view(), name="analytics-concentration"),
    path("analytics/anomalies", AnomaliesView.as_view(), name="analytics-anomalies"),
    path(
        "analytics/country-profile/<str:iso3>",
        CountryProfileView.as_view(),
        name="analytics-country-profile",
    ),
    path(
        "analytics/product-profile/<str:hs2>",
        ProductProfileView.as_view(),
        name="analytics-product-profile",
    ),
] + router.urls
