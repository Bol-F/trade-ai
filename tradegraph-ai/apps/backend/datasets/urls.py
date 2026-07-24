from django.urls import path

from datasets.views import DataFreshnessView, DataSourceListView

urlpatterns = [
    path("data-sources", DataSourceListView.as_view(), name="data-source-list"),
    path("data-freshness", DataFreshnessView.as_view(), name="data-freshness"),
]
