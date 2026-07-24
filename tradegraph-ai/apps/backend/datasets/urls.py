from django.urls import path

from datasets.views import AdminDataHealthView, DataFreshnessView, DataSourceListView

urlpatterns = [
    path("data-sources", DataSourceListView.as_view(), name="data-source-list"),
    path("data-freshness", DataFreshnessView.as_view(), name="data-freshness"),
    path("admin/data-health", AdminDataHealthView.as_view(), name="admin-data-health"),
]
