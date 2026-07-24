from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.functions import Lower


class Country(models.Model):
    baci_code = models.CharField(max_length=8, unique=True)
    m49_code = models.CharField(max_length=3, unique=True)
    iso2 = models.CharField(max_length=2, unique=True)
    iso3 = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=150)
    region = models.CharField(max_length=100, blank=True)
    subregion = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    landlocked = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "countries"
        constraints = [
            models.UniqueConstraint(Lower("iso2"), name="unique_country_iso2_ci"),
            models.UniqueConstraint(Lower("iso3"), name="unique_country_iso3_ci"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.iso3})"

    def save(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        self.iso2 = self.iso2.upper()
        self.iso3 = self.iso3.upper()
        super().save(*args, **kwargs)


class ProductClassification(models.Model):
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    version = models.CharField(max_length=20)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("code", "version"), name="unique_classification_version"
            )
        ]
        ordering = ("code", "version")

    def __str__(self) -> str:
        return f"{self.code} {self.version}"


class Product(models.Model):
    class Level(models.IntegerChoices):
        HS2 = 2, "HS2"
        HS4 = 4, "HS4"
        HS6 = 6, "HS6"

    classification = models.ForeignKey(
        ProductClassification, on_delete=models.PROTECT, related_name="products"
    )
    code = models.CharField(max_length=6)
    level = models.PositiveSmallIntegerField(
        choices=Level.choices, validators=[MinValueValidator(2), MaxValueValidator(6)]
    )
    parent_code = models.CharField(max_length=6, blank=True)
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("classification", "code"), name="unique_product_classification_code"
            ),
            models.CheckConstraint(
                condition=models.Q(level__in=(2, 4, 6)), name="supported_product_level"
            ),
        ]
        ordering = ("code",)

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"
