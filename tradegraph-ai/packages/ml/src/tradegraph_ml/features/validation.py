from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
import polars as pl

from .trade import FEATURE_DATASET_VERSION_COLUMN, KEYS

EXPECTED_COLUMNS = {
    *KEYS,
    "year",
    "target",
    "trade_value_lag_1",
    "trade_value_lag_2",
    "trade_value_lag_3",
    "quantity_lag_1",
    "growth_lag_1",
    "rolling_mean_3",
    "rolling_std_3",
    "supplier_share",
    "supplier_count",
    "hhi",
    "global_product_growth",
    FEATURE_DATASET_VERSION_COLUMN,
}


@dataclass(frozen=True)
class FeatureValidationReport:
    passed: bool
    errors: list[str]
    warnings: list[str]
    row_count: int
    missing_percentages: dict[str, float]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class FeatureValidationError(ValueError):
    pass


def validate_feature_frame(
    frame: pl.DataFrame, expected_dataset_version: str | None = None
) -> FeatureValidationReport:
    errors: list[str] = []
    warnings: list[str] = []
    missing = EXPECTED_COLUMNS - set(frame.columns)
    if missing:
        errors.append(f"Missing expected columns: {', '.join(sorted(missing))}")
        return FeatureValidationReport(False, errors, warnings, frame.height, {})
    keys = [*KEYS, "year"]
    if frame.select(keys).n_unique() != frame.height:
        errors.append("Feature-row keys must be unique.")
    if frame.sort(keys).select(keys).to_dicts() != frame.select(keys).to_dicts():
        errors.append("Feature rows must be chronologically ordered within stable keys.")
    if not frame.schema["year"].is_integer():
        errors.append("year must use an integer data type.")
    for field in (*KEYS, FEATURE_DATASET_VERSION_COLUMN):
        if frame.schema[field] != pl.String:
            errors.append(f"{field} must use a string data type.")
    numeric = sorted(EXPECTED_COLUMNS - {*KEYS, FEATURE_DATASET_VERSION_COLUMN})
    invalid_numeric = [name for name in numeric if not frame.schema[name].is_numeric()]
    if invalid_numeric:
        errors.append(f"Numeric columns have invalid types: {', '.join(invalid_numeric)}")
    missing_percentages = {
        name: round(frame[name].null_count() * 100 / max(frame.height, 1), 3)
        for name in frame.columns
    }
    warnings.extend(
        f"{name} is {value}% missing." for name, value in missing_percentages.items() if value > 50
    )
    if not invalid_numeric and np.isinf(frame.select(numeric).to_numpy().astype(float)).any():
        errors.append("Feature data contains infinite values.")
    if frame["target"].null_count():
        errors.append("Training target must be available for every feature row.")
    if (frame["trade_value_lag_1"] < 0).any() or (frame["quantity_lag_1"].drop_nulls() < 0).any():
        errors.append("Lagged value and quantity fields cannot be negative.")
    if (
        not frame["importer"].str.contains(r"^[A-Z]{3}$").all()
        or not frame["exporter"].str.contains(r"^[A-Z]{3}$").all()
    ):
        errors.append("Country identifiers must be ISO3-like uppercase codes.")
    if not frame["hs2"].str.contains(r"^\d{2}$").all():
        errors.append("Product identifiers must be two-digit HS2 codes.")
    versions = frame[FEATURE_DATASET_VERSION_COLUMN].unique().to_list()
    if len(versions) != 1 or (expected_dataset_version and versions != [expected_dataset_version]):
        errors.append("Feature rows must reference one consistent dataset version.")
    return FeatureValidationReport(not errors, errors, warnings, frame.height, missing_percentages)


def require_valid_features(
    frame: pl.DataFrame, expected_dataset_version: str | None = None
) -> FeatureValidationReport:
    report = validate_feature_frame(frame, expected_dataset_version)
    if not report.passed:
        raise FeatureValidationError("; ".join(report.errors))
    return report
