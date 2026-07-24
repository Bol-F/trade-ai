from rest_framework import serializers


class ForecastRequestSerializer(serializers.Serializer[dict[str, object]]):
    importer = serializers.CharField(min_length=3, max_length=3)
    exporter = serializers.CharField(min_length=3, max_length=3)
    hs2 = serializers.RegexField(r"^\d{2}$")
    year = serializers.IntegerField(min_value=1900, max_value=2200, required=False)


class SupplierRequestSerializer(serializers.Serializer[dict[str, object]]):
    importer = serializers.CharField(min_length=3, max_length=3)
    hs2 = serializers.RegexField(r"^\d{2}$")
    year = serializers.IntegerField(min_value=1900, max_value=2200, required=False)
