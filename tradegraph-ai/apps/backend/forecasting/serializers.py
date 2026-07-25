from rest_framework import serializers


class ForecastRequestSerializer(serializers.Serializer[dict[str, object]]):
    importer = serializers.RegexField(r"^[A-Za-z]{3}$")
    exporter = serializers.RegexField(r"^[A-Za-z]{3}$")
    hs2 = serializers.RegexField(r"^\d{2}$")
    year = serializers.IntegerField(min_value=1900, max_value=2200, required=False)

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        attrs["importer"] = str(attrs["importer"]).upper()
        attrs["exporter"] = str(attrs["exporter"]).upper()
        return attrs


class SupplierRequestSerializer(serializers.Serializer[dict[str, object]]):
    importer = serializers.RegexField(r"^[A-Za-z]{3}$")
    hs2 = serializers.RegexField(r"^\d{2}$")
    year = serializers.IntegerField(min_value=1900, max_value=2200, required=False)

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        attrs["importer"] = str(attrs["importer"]).upper()
        return attrs
