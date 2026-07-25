from rest_framework import serializers

from analytics.models import AnalysisExport, Favorite, SavedAnalysis, SavedComparison, WatchlistItem


class SavedAnalysisSerializer(serializers.ModelSerializer[SavedAnalysis]):
    class Meta:
        model = SavedAnalysis
        fields = (
            "id",
            "title",
            "description",
            "filters",
            "visualization",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_filters(self, value: object) -> dict[str, object]:
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a JSON object.")
        allowed = {
            "importer",
            "exporter",
            "product",
            "start_year",
            "end_year",
            "direction",
            "aggregation_level",
        }
        unknown = set(value) - allowed
        if unknown:
            raise serializers.ValidationError(f"Unsupported filters: {', '.join(sorted(unknown))}.")
        for field in ("importer", "exporter"):
            candidate = value.get(field)
            if candidate is not None and (
                not isinstance(candidate, str)
                or len(candidate) != 3
                or not candidate.isascii()
                or not candidate.isalpha()
            ):
                raise serializers.ValidationError(f"{field} must be a three-letter ISO code.")
        product = value.get("product")
        if product is not None and (
            not isinstance(product, str) or len(product) not in {2, 4, 6} or not product.isdigit()
        ):
            raise serializers.ValidationError("product must be a 2, 4, or 6 digit HS code.")
        return value


class FavoriteSerializer(serializers.ModelSerializer[Favorite]):
    class Meta:
        model = Favorite
        fields = ("id", "kind", "code", "label", "created_at")
        read_only_fields = ("id", "created_at")


class WatchlistItemSerializer(serializers.ModelSerializer[WatchlistItem]):
    importer = serializers.RegexField(r"^[A-Za-z]{3}$")
    exporter = serializers.RegexField(r"^[A-Za-z]{3}$", allow_blank=True, required=False)
    product = serializers.RegexField(r"^(?:\d{2}|\d{4}|\d{6})$")

    class Meta:
        model = WatchlistItem
        fields = (
            "id",
            "name",
            "importer",
            "exporter",
            "product",
            "start_year",
            "end_year",
            "created_at",
            "last_viewed_at",
        )
        read_only_fields = ("id", "created_at", "last_viewed_at")

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        if int(attrs["start_year"]) > int(attrs["end_year"]):
            raise serializers.ValidationError("Start year must not be after end year.")
        attrs["importer"] = str(attrs["importer"]).upper()
        attrs["exporter"] = str(attrs.get("exporter", "")).upper()
        return attrs


class SavedComparisonSerializer(serializers.ModelSerializer[SavedComparison]):
    product = serializers.RegexField(r"^(?:\d{2}|\d{4}|\d{6})$")

    class Meta:
        model = SavedComparison
        fields = (
            "id",
            "name",
            "countries",
            "suppliers",
            "product",
            "start_year",
            "end_year",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        countries, suppliers = attrs.get("countries", []), attrs.get("suppliers", [])
        if not isinstance(countries, list) or not 2 <= len(countries) <= 4:
            raise serializers.ValidationError({"countries": "Select two to four countries."})
        if not isinstance(suppliers, list) or (suppliers and not 2 <= len(suppliers) <= 4):
            raise serializers.ValidationError(
                {"suppliers": "Select two to four suppliers or none."}
            )
        if int(attrs["start_year"]) > int(attrs["end_year"]):
            raise serializers.ValidationError("Start year must not be after end year.")
        for field, values in (("countries", countries), ("suppliers", suppliers)):
            if any(
                not isinstance(code, str)
                or len(code) != 3
                or not code.isascii()
                or not code.isalpha()
                for code in values
            ):
                raise serializers.ValidationError({field: "Codes must be three-letter ISO values."})
            attrs[field] = [code.upper() for code in values]
        return attrs


class AnalysisExportSerializer(serializers.ModelSerializer[AnalysisExport]):
    class Meta:
        model = AnalysisExport
        fields = ("id", "analysis", "format", "status", "expires_at", "error_message", "created_at")
        read_only_fields = ("id", "status", "expires_at", "error_message", "created_at")
