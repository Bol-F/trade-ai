import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("analytics", "0001_initial"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name="Favorite", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("kind", models.CharField(choices=[("country", "Country"), ("product", "Product")], max_length=10)),
            ("code", models.CharField(max_length=12)), ("label", models.CharField(max_length=200)),
            ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ("kind", "label")}),
        migrations.CreateModel(name="WatchlistItem", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("name", models.CharField(max_length=160)), ("importer", models.CharField(max_length=3)),
            ("exporter", models.CharField(blank=True, max_length=3)), ("product", models.CharField(max_length=6)),
            ("start_year", models.PositiveSmallIntegerField()), ("end_year", models.PositiveSmallIntegerField()),
            ("last_viewed_at", models.DateTimeField(blank=True, null=True)),
            ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ("-updated_at",)}),
        migrations.CreateModel(name="SavedComparison", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("name", models.CharField(max_length=160)), ("countries", models.JSONField(default=list)),
            ("suppliers", models.JSONField(default=list)), ("product", models.CharField(max_length=6)),
            ("start_year", models.PositiveSmallIntegerField()), ("end_year", models.PositiveSmallIntegerField()),
            ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ("-updated_at",)}),
        migrations.CreateModel(name="AnalysisExport", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("format", models.CharField(choices=[("csv", "CSV"), ("json", "JSON"), ("html", "Print-friendly HTML")], max_length=8)),
            ("status", models.CharField(choices=[("pending", "Pending"), ("ready", "Ready"), ("failed", "Failed"), ("expired", "Expired")], default="pending", max_length=10)),
            ("content", models.TextField(blank=True)), ("expires_at", models.DateTimeField()),
            ("error_message", models.CharField(blank=True, max_length=300)),
            ("analysis", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="exports", to="analytics.savedanalysis")),
            ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ("-created_at",)}),
        migrations.AddConstraint(model_name="favorite", constraint=models.UniqueConstraint(fields=("owner", "kind", "code"), name="unique_owner_favorite")),
        migrations.AddIndex(model_name="watchlistitem", index=models.Index(fields=["owner", "-updated_at"], name="watch_owner_updated_idx")),
    ]
