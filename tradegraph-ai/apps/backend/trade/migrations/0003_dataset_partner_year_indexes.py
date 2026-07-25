from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("trade", "0002_annualtradeflow_trade_import_hs2_year_idx_and_more")]

    operations = [
        migrations.RemoveIndex(
            model_name="annualtradeflow",
            name="trade_exporter_year_idx",
        ),
        migrations.RemoveIndex(
            model_name="annualtradeflow",
            name="trade_importer_year_idx",
        ),
        migrations.AddIndex(
            model_name="annualtradeflow",
            index=models.Index(
                fields=["dataset_version", "exporter", "year"],
                name="trade_ds_exporter_year_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="annualtradeflow",
            index=models.Index(
                fields=["dataset_version", "importer", "year"],
                name="trade_ds_importer_year_idx",
            ),
        ),
    ]
