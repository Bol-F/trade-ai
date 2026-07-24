from django.urls import path

from catalog.views import (
    CountryDetailView,
    CountryListView,
    ProductDetailView,
    ProductListView,
    ProductTreeView,
)

urlpatterns = [
    path("countries", CountryListView.as_view(), name="country-list"),
    path("countries/<str:iso3>", CountryDetailView.as_view(), name="country-detail"),
    path("products", ProductListView.as_view(), name="product-list"),
    path("products/tree", ProductTreeView.as_view(), name="product-tree"),
    path("products/<str:code>", ProductDetailView.as_view(), name="product-detail"),
]
