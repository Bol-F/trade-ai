from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.filters import CountryFilter, ProductFilter
from catalog.models import Country, Product
from catalog.serializers import CountrySerializer, ProductSerializer


class CountryListView(ListAPIView[Country]):
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    filterset_class = CountryFilter


class CountryDetailView(RetrieveAPIView[Country]):
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    lookup_field = "iso3"

    def get_object(self) -> Country:
        self.kwargs["iso3"] = self.kwargs["iso3"].upper()
        return super().get_object()


class ProductListView(ListAPIView[Product]):
    queryset = Product.objects.filter(
        is_active=True, classification__code="HS", classification__version="92"
    ).select_related("classification")
    serializer_class = ProductSerializer
    filterset_class = ProductFilter


class ProductDetailView(RetrieveAPIView[Product]):
    queryset = Product.objects.filter(
        is_active=True, classification__code="HS", classification__version="92"
    ).select_related("classification")
    serializer_class = ProductSerializer
    lookup_field = "code"


class ProductTreeView(APIView):
    @extend_schema(responses=ProductSerializer(many=True))
    def get(self, request: Request) -> Response:
        products = list(
            Product.objects.filter(
                is_active=True, classification__code="HS", classification__version="92"
            )
            .select_related("classification")
            .order_by("code")
        )
        children: dict[str, list[dict[str, Any]]] = {}
        roots: list[dict[str, Any]] = []
        for product in products:
            node = ProductSerializer(product).data
            node["children"] = children.setdefault(product.code, [])
            if product.parent_code:
                children.setdefault(product.parent_code, []).append(node)
            else:
                roots.append(node)
        return Response(roots)
