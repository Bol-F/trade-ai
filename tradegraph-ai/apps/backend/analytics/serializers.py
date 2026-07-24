from rest_framework import serializers

from analytics.models import SavedAnalysis


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
