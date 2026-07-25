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
        return value


class FavoriteSerializer(serializers.ModelSerializer[Favorite]):
    class Meta:
        model = Favorite
        fields = ("id", "kind", "code", "label", "created_at")
        read_only_fields = ("id", "created_at")


class WatchlistItemSerializer(serializers.ModelSerializer[WatchlistItem]):
    class Meta:
        model = WatchlistItem
        fields = ("id", "name", "importer", "exporter", "product", "start_year", "end_year", "created_at", "last_viewed_at")
        read_only_fields = ("id", "created_at", "last_viewed_at")

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        if int(attrs["start_year"]) > int(attrs["end_year"]):
            raise serializers.ValidationError("Start year must not be after end year.")
        return attrs


class SavedComparisonSerializer(serializers.ModelSerializer[SavedComparison]):
    class Meta:
        model = SavedComparison
        fields = ("id", "name", "countries", "suppliers", "product", "start_year", "end_year", "created_at")
        read_only_fields = ("id", "created_at")

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        countries, suppliers = attrs.get("countries", []), attrs.get("suppliers", [])
        if not isinstance(countries, list) or not 2 <= len(countries) <= 4:
            raise serializers.ValidationError({"countries": "Select two to four countries."})
        if not isinstance(suppliers, list) or (suppliers and not 2 <= len(suppliers) <= 4):
            raise serializers.ValidationError({"suppliers": "Select two to four suppliers or none."})
        if int(attrs["start_year"]) > int(attrs["end_year"]):
            raise serializers.ValidationError("Start year must not be after end year.")
        return attrs


class AnalysisExportSerializer(serializers.ModelSerializer[AnalysisExport]):
    class Meta:
        model = AnalysisExport
        fields = ("id", "analysis", "format", "status", "expires_at", "error_message", "created_at")
        read_only_fields = ("id", "status", "expires_at", "error_message", "created_at")
