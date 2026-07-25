from decimal import Decimal

from catalog.models import Country, ProductClassification
from datasets.models import DatasetVersion, DataSource
from django.core.validators import MinValueValidator
from django.db import models


class AnnualTradeFlow(models.Model):
    dataset_version = models.ForeignKey(
        DatasetVersion, on_delete=models.CASCADE, related_name="trade_flows"
    )
    year = models.PositiveSmallIntegerField()
    classification = models.ForeignKey(ProductClassification, on_delete=models.PROTECT)
    hs6_code = models.CharField(max_length=6)
    hs4_code = models.CharField(max_length=4)
    hs2_code = models.CharField(max_length=2)
    exporter = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="exported_trade_flows"
    )
    importer = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="imported_trade_flows"
    )
    trade_value_usd = models.DecimalField(
        max_digits=20, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    quantity_tons = models.DecimalField(
        max_digits=20,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    unit_value_usd_per_ton = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    source = models.ForeignKey(DataSource, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("dataset_version", "year", "exporter", "importer", "hs6_code"),
                name="unique_annual_trade_flow",
            )
        ]
        indexes = [
            models.Index(fields=("dataset_version", "year"), name="trade_dataset_year_idx"),
            models.Index(
                fields=("dataset_version", "exporter", "year"),
                name="trade_ds_exporter_year_idx",
            ),
            models.Index(
                fields=("dataset_version", "importer", "year"),
                name="trade_ds_importer_year_idx",
            ),
            models.Index(fields=("hs2_code", "year"), name="trade_hs2_year_idx"),
            models.Index(fields=("hs6_code", "year"), name="trade_hs6_year_idx"),
            models.Index(
                fields=("dataset_version", "importer", "hs2_code", "year"),
                name="trade_import_hs2_year_idx",
            ),
            models.Index(
                fields=("dataset_version", "exporter", "hs2_code", "year"),
                name="trade_export_hs2_year_idx",
            ),
        ]
        ordering = ("year", "exporter_id", "importer_id", "hs6_code")

    def __str__(self) -> str:
        return f"{self.year} {self.exporter_id} → {self.importer_id} {self.hs6_code}"
