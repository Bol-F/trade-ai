from django.contrib import admin

from datasets.models import DatasetVersion, DataSource, IngestionRun

admin.site.register(DataSource)
admin.site.register(DatasetVersion)
admin.site.register(IngestionRun)
