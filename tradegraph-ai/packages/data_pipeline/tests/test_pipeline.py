from pathlib import Path

import polars as pl
import pytest
from tradegraph_data_pipeline.extract.csv import read_baci_csv
from tradegraph_data_pipeline.transform.normalize import normalize_baci
from tradegraph_data_pipeline.validate.baci import PipelineValidationError, validate_baci

COUNTRIES = {"860", "156"}
PRODUCTS = {"010121"}


def frame(**overrides: object) -> pl.DataFrame:
    values: dict[str, list[object]] = {
        "t": [2024],
        "i": ["860"],
        "j": ["156"],
        "k": ["010121"],
        "v": [1.5],
        "q": [None],
    }
    for key, value in overrides.items():
        values[key] = value if isinstance(value, list) else [value]
    return pl.DataFrame(values)


def test_csv_schema_and_missing_quantity() -> None:
    result = validate_baci(frame(), COUNTRIES, PRODUCTS)
    normalized = normalize_baci(frame())
    assert result.row_count == 1
    assert normalized["quantity_tons"][0] is None
    assert normalized["unit_value_usd_per_ton"][0] is None


def test_trade_value_converts_from_thousands_to_usd() -> None:
    normalized = normalize_baci(frame(v=12.25, q=2.0))
    assert normalized["trade_value_usd"][0] == 12_250.0
    assert normalized["unit_value_usd_per_ton"][0] == 6_125.0


def test_baci_orientation_and_zero_quantity_are_explicit() -> None:
    normalized = normalize_baci(frame(i="860", j="156", q=0))
    assert normalized["exporter_code"][0] == "860"
    assert normalized["importer_code"][0] == "156"
    assert normalized["quantity_tons"][0] == 0
    assert normalized["unit_value_usd_per_ton"][0] is None


def test_leading_zero_product_code_is_preserved() -> None:
    assert normalize_baci(frame())["hs6_code"][0] == "010121"


def test_duplicate_rows_are_rejected() -> None:
    duplicate = pl.concat([frame(), frame()])
    with pytest.raises(PipelineValidationError, match="duplicate"):
        validate_baci(duplicate, COUNTRIES, PRODUCTS)


@pytest.mark.parametrize(("field", "value"), [("v", -1), ("q", -1)])
def test_negative_trade_values_and_quantities_are_rejected(field: str, value: int) -> None:
    with pytest.raises(PipelineValidationError, match="invalid"):
        validate_baci(frame(**{field: value}), COUNTRIES, PRODUCTS)


def test_hs_codes_remain_six_character_strings() -> None:
    for code in ("1", "01", "10121", "010121"):
        normalized = normalize_baci(frame(k=code))
        value = normalized["hs6_code"][0]
        assert isinstance(value, str)
        assert value == code.zfill(6)


def test_required_columns_are_enforced() -> None:
    with pytest.raises(PipelineValidationError, match="Missing required columns"):
        validate_baci(frame().drop("q"), COUNTRIES, PRODUCTS)


def test_checked_in_sample_is_readable() -> None:
    sample = Path(__file__).resolve().parents[3] / "data" / "sample" / "baci_sample.csv"
    assert read_baci_csv(sample).height == 40
