from django.urls import path

from trade.views import (
    TopCountriesView,
    TopProductsView,
    TradeOverviewView,
    TradePartnersView,
    TradeTimeseriesView,
)

urlpatterns = [
    path("trade/overview", TradeOverviewView.as_view(), name="trade-overview"),
    path("trade/timeseries", TradeTimeseriesView.as_view(), name="trade-timeseries"),
    path("trade/partners", TradePartnersView.as_view(), name="trade-partners"),
    path("trade/top-products", TopProductsView.as_view(), name="trade-top-products"),
    path("trade/top-countries", TopCountriesView.as_view(), name="trade-top-countries"),
]
