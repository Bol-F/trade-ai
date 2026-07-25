from django.urls import path
from rest_framework.routers import SimpleRouter

from analytics.views import (
    AnomaliesView,
    ConcentrationView,
    CountryProfileView,
    ExposureView,
    ProductProfileView,
    SavedAnalysisViewSet,
    AnalysisExportViewSet,
    FavoriteViewSet,
    SavedComparisonViewSet,
    WatchlistViewSet,
    WorkspaceView,
)

router = SimpleRouter(trailing_slash=False)
router.register("saved-analyses", SavedAnalysisViewSet, basename="saved-analysis")
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register("watchlists", WatchlistViewSet, basename="watchlist")
router.register("saved-comparisons", SavedComparisonViewSet, basename="saved-comparison")
router.register("exports", AnalysisExportViewSet, basename="analysis-export")

urlpatterns = [
    path("workspace", WorkspaceView.as_view(), name="workspace"),
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
