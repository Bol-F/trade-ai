from django.contrib import admin

from catalog.models import Country, Product, ProductClassification

admin.site.register(Country)
admin.site.register(ProductClassification)
admin.site.register(Product)
