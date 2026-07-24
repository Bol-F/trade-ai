import json

import pytest
from catalog.models import Country, Product, ProductClassification
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def make_country(**overrides: object) -> Country:
    values = {
        "baci_code": "860",
        "m49_code": "860",
        "iso2": "UZ",
        "iso3": "UZB",
        "name": "Uzbekistan",
        "region": "Asia",
        **overrides,
    }
    return Country.objects.create(**values)


def test_country_filtering_and_case_insensitive_search(api_client: APIClient) -> None:
    make_country()
    make_country(
        baci_code="250",
        m49_code="250",
        iso2="FR",
        iso3="FRA",
        name="France",
        region="Europe",
    )
    response = api_client.get(reverse("country-list"), {"region": "asia", "search": "uzbek"})
    assert response.status_code == 200
    assert [row["iso3"] for row in response.data["results"]] == ["UZB"]


def test_product_search_preserves_leading_zero_codes(api_client: APIClient) -> None:
    classification = ProductClassification.objects.create(
        code="HS", name="Harmonized System", version="92"
    )
    Product.objects.create(
        classification=classification, code="010121", level=6, name="Pure-bred horses"
    )
    response = api_client.get(reverse("product-list"), {"search": "0101"})
    assert response.status_code == 200
    assert response.data["results"][0]["code"] == "010121"


def test_country_import_command(tmp_path) -> None:  # type: ignore[no-untyped-def]
    source = tmp_path / "countries.json"
    source.write_text(
        json.dumps(
            [
                {
                    "baci_code": "860",
                    "m49_code": "860",
                    "iso2": "uz",
                    "iso3": "uzb",
                    "name": "Uzbekistan",
                    "region": "Asia",
                    "landlocked": True,
                }
            ]
        ),
        encoding="utf-8",
    )
    call_command("import_countries", str(source))
    assert Country.objects.get().iso3 == "UZB"


def test_product_import_command_preserves_leading_zero(tmp_path) -> None:  # type: ignore[no-untyped-def]
    source = tmp_path / "products.csv"
    source.write_text(
        "code,level,parent_code,name\n01,2,,Live animals\n0101,4,01,Horses\n",
        encoding="utf-8",
    )
    call_command("import_products", str(source))
    assert list(Product.objects.values_list("code", flat=True)) == ["01", "0101"]
