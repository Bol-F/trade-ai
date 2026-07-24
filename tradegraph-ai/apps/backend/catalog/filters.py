import django_filters
from django.db.models import Q

from catalog.models import Country, Product


class CountryFilter(django_filters.FilterSet):
    region = django_filters.CharFilter(field_name="region", lookup_expr="iexact")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Country
        fields = ("region",)

    def filter_search(self, queryset, name, value):  # type: ignore[no-untyped-def]
        return queryset.filter(
            Q(name__icontains=value) | Q(iso2__iexact=value) | Q(iso3__iexact=value)
        )


class ProductFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    parent = django_filters.CharFilter(field_name="parent_code")

    class Meta:
        model = Product
        fields = ("level", "parent")

    def filter_search(self, queryset, name, value):  # type: ignore[no-untyped-def]
        return queryset.filter(Q(code__icontains=value) | Q(name__icontains=value))
