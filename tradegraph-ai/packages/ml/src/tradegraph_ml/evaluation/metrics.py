from __future__ import annotations

from typing import Any

import numpy as np
import polars as pl
from sklearn.metrics import (
    mean_absolute_error,
    median_absolute_error,
    root_mean_squared_error,
)


def chronological_split(
    frame: pl.DataFrame, validation_year: int, test_year: int
) -> tuple[pl.DataFrame, pl.DataFrame, pl.DataFrame]:
    if validation_year >= test_year:
        raise ValueError("Validation must precede test.")
    return (
        frame.filter(pl.col("year") < validation_year),
        frame.filter((pl.col("year") >= validation_year) & (pl.col("year") < test_year)),
        frame.filter(pl.col("year") >= test_year),
    )


def evaluate(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    denominator = np.abs(actual) + np.abs(predicted)
    smape = np.mean(
        np.divide(
            2 * np.abs(predicted - actual),
            denominator,
            out=np.zeros_like(actual),
            where=denominator != 0,
        )
    )
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(root_mean_squared_error(actual, predicted)),
        "smape": float(smape),
        "median_absolute_error": float(median_absolute_error(actual, predicted)),
        "weighted_absolute_error": float(
            np.average(np.abs(predicted - actual), weights=np.maximum(actual, 1))
        ),
    }


def grouped_evaluation(
    frame: pl.DataFrame, actual: np.ndarray, predicted: np.ndarray
) -> dict[str, Any]:
    evaluated = frame.with_columns(
        pl.Series("actual", actual), pl.Series("predicted", predicted)
    ).with_columns(
        pl.col("actual").qcut([0.33, 0.66], labels=["small", "medium", "large"]).alias("size_group")
    )
    result: dict[str, Any] = {"global": evaluate(actual, predicted)}
    evaluated = evaluated.with_columns(
        pl.when(pl.col("year").count().over(["importer", "exporter", "hs2"]) < 5)
        .then(pl.lit("short"))
        .otherwise(pl.lit("long"))
        .alias("history_length"),
        pl.when((pl.col("actual") == 0).mean().over(["importer", "exporter", "hs2"]) >= 0.3)
        .then(pl.lit("zero_heavy"))
        .otherwise(pl.lit("stable"))
        .alias("flow_type"),
    )
    for field in ("hs2", "importer", "exporter", "size_group", "history_length", "flow_type"):
        result[f"by_{field}"] = {
            str(group[0]): evaluate(subset["actual"].to_numpy(), subset["predicted"].to_numpy())
            for group, subset in evaluated.group_by(field)
        }
    return result


def expanding_window_splits(
    frame: pl.DataFrame, minimum_training_years: int = 3
) -> list[tuple[pl.DataFrame, pl.DataFrame]]:
    years = sorted(frame["year"].unique().to_list())
    splits: list[tuple[pl.DataFrame, pl.DataFrame]] = []
    for index in range(minimum_training_years, len(years)):
        evaluation_year = years[index]
        train = frame.filter(pl.col("year") < evaluation_year)
        test = frame.filter(pl.col("year") == evaluation_year)
        if not train.is_empty() and not test.is_empty():
            splits.append((train, test))
    return splits
