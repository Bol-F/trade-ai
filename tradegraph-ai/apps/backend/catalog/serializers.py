from rest_framework import serializers

from catalog.models import Country, Product, ProductClassification


class CountrySerializer(serializers.ModelSerializer[Country]):
    class Meta:
        model = Country
        fields = "__all__"


class ProductClassificationSerializer(serializers.ModelSerializer[ProductClassification]):
    class Meta:
        model = ProductClassification
        fields = ("code", "name", "version")


class ProductSerializer(serializers.ModelSerializer[Product]):
    classification = ProductClassificationSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "classification",
            "code",
            "level",
            "parent_code",
            "name",
            "description",
            "is_active",
        )
