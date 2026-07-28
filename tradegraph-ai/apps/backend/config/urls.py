from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from health.metrics import metrics
from health.views import LivenessView, ReadinessView

from config.i18n import LanguagePreferenceView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("i18n/", include("django.conf.urls.i18n")),
    path("api/v1/i18n/language", LanguagePreferenceView.as_view(), name="language-preference"),
    path("api/v1/health/live", LivenessView.as_view(), name="health-live"),
    path("api/v1/health/ready", ReadinessView.as_view(), name="health-ready"),
    path("metrics", metrics, name="metrics"),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("datasets.urls")),
    path("api/v1/", include("trade.urls")),
    path("api/v1/", include("analytics.urls")),
    path("api/v1/", include("forecasting.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
