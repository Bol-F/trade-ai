from dataclasses import dataclass

import polars as pl

REQUIRED_COLUMNS = {"t", "i", "j", "k", "v", "q"}


class PipelineValidationError(ValueError):
    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("; ".join(errors))


@dataclass(frozen=True)
class ValidationResult:
    row_count: int
    min_year: int
    max_year: int


def validate_baci(
    frame: pl.DataFrame,
    known_country_codes: set[str],
    known_product_codes: set[str],
) -> ValidationResult:
    errors: list[str] = []
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise PipelineValidationError([f"Missing required columns: {', '.join(sorted(missing))}"])
    if frame.is_empty():
        raise PipelineValidationError(["Dataset contains no rows."])

    normalized_countries = {
        value.strip().zfill(3)
        for column in ("i", "j")
        for value in frame.get_column(column).drop_nulls().to_list()
    }
    normalized_products = {
        value.strip().zfill(6) for value in frame.get_column("k").drop_nulls().to_list()
    }
    invalid_years = frame.filter(pl.col("t").is_null() | ~pl.col("t").is_between(1900, 2100))
    if invalid_years.height:
        errors.append(f"{invalid_years.height} rows contain invalid years.")
    invalid_hs6 = frame.filter(
        pl.col("k").is_null()
        | ~pl.col("k").str.strip_chars().str.pad_start(6, "0").str.contains(r"^\d{6}$")
    )
    if invalid_hs6.height:
        errors.append(f"{invalid_hs6.height} rows contain invalid HS6 codes.")
    unknown_countries = normalized_countries - known_country_codes
    if unknown_countries:
        errors.append(f"Unknown country codes: {', '.join(sorted(unknown_countries))}.")
    unknown_products = normalized_products - known_product_codes
    if unknown_products:
        errors.append(f"Unknown product codes: {', '.join(sorted(unknown_products))}.")
    invalid_values = frame.filter(pl.col("v").is_null() | (pl.col("v") < 0))
    if invalid_values.height:
        errors.append(f"{invalid_values.height} rows contain invalid trade values.")
    invalid_quantities = frame.filter(pl.col("q").is_not_null() & (pl.col("q") < 0))
    if invalid_quantities.height:
        errors.append(f"{invalid_quantities.height} rows contain invalid quantities.")
    duplicate_count = frame.select(("t", "i", "j", "k")).is_duplicated().sum()
    if duplicate_count:
        errors.append(f"{duplicate_count} duplicate trade rows found.")
    if errors:
        raise PipelineValidationError(errors)

    return ValidationResult(
        row_count=frame.height,
        min_year=int(frame.get_column("t").min()),  # type: ignore[arg-type]
        max_year=int(frame.get_column("t").max()),  # type: ignore[arg-type]
    )
