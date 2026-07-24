from rest_framework import serializers

from datasets.models import DataSource


class DataSourceSerializer(serializers.ModelSerializer[DataSource]):
    class Meta:
        model = DataSource
        fields = (
            "id",
            "code",
            "name",
            "homepage",
            "license_name",
            "requires_api_key",
            "is_enabled",
            "created_at",
            "updated_at",
        )
