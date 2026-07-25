from __future__ import annotations

import polars as pl

FEATURE_SCHEMA_VERSION = "forecast-v2"
FEATURE_DATASET_VERSION_COLUMN = "feature_dataset_version"
KEYS = ["importer", "exporter", "hs2"]


def build_forecast_features(
    flows: pl.DataFrame, feature_dataset_version: str = "unknown"
) -> pl.DataFrame:
    annual = (
        flows.group_by([*KEYS, "year"])
        .agg(
            pl.col("trade_value_usd").sum(),
            pl.when(pl.col("quantity_tons").count() > 0)
            .then(pl.col("quantity_tons").sum())
            .otherwise(None)
            .alias("quantity_tons"),
            pl.col("supplier_share").mean().fill_null(0),
            pl.col("supplier_count").max().fill_null(0),
            pl.col("hhi").mean().fill_null(0),
            pl.col("global_product_growth").mean().fill_null(0),
        )
        .sort([*KEYS, "year"])
    )
    result = annual
    for lag in (1, 2, 3):
        lagged = annual.select(
            *KEYS,
            (pl.col("year") + lag).alias("year"),
            pl.col("trade_value_usd").alias(f"trade_value_lag_{lag}"),
            *([pl.col("quantity_tons").alias("quantity_lag_1")] if lag == 1 else []),
        )
        result = result.join(lagged, on=[*KEYS, "year"], how="left")
    target = annual.select(
        *KEYS,
        (pl.col("year") - 1).alias("year"),
        pl.col("trade_value_usd").log1p().alias("target"),
    )
    return (
        result.join(target, on=[*KEYS, "year"], how="left")
        .with_columns(
            (
                (pl.col("trade_value_lag_1") - pl.col("trade_value_lag_2"))
                / pl.col("trade_value_lag_2")
            )
            .fill_nan(None)
            .alias("growth_lag_1"),
            pl.mean_horizontal("trade_value_lag_1", "trade_value_lag_2", "trade_value_lag_3")
            .alias("rolling_mean_3"),
            pl.concat_list("trade_value_lag_1", "trade_value_lag_2", "trade_value_lag_3")
            .list.std()
            .alias("rolling_std_3"),
            pl.lit(feature_dataset_version).alias(FEATURE_DATASET_VERSION_COLUMN),
        )
        .drop_nulls(["trade_value_lag_1", "target"])
    )
