from __future__ import annotations

import polars as pl

FEATURE_SCHEMA_VERSION = "forecast-v1"
KEYS = ["importer", "exporter", "hs2"]


def build_forecast_features(flows: pl.DataFrame) -> pl.DataFrame:
    annual = (
        flows.group_by([*KEYS, "year"])
        .agg(
            pl.col("trade_value_usd").sum(),
            pl.col("quantity_tons").sum(),
            pl.col("supplier_share").mean().fill_null(0),
            pl.col("supplier_count").max().fill_null(0),
            pl.col("hhi").mean().fill_null(0),
            pl.col("global_product_growth").mean().fill_null(0),
        )
        .sort([*KEYS, "year"])
    )
    over_group = pl.col("trade_value_usd").over(KEYS)
    quantity_group = pl.col("quantity_tons").over(KEYS)
    return (
        annual.with_columns(
            over_group.shift(1).alias("trade_value_lag_1"),
            over_group.shift(2).alias("trade_value_lag_2"),
            over_group.shift(3).alias("trade_value_lag_3"),
            quantity_group.shift(1).alias("quantity_lag_1"),
            over_group.shift(-1).log1p().alias("target"),
        )
        .with_columns(
            (
                (pl.col("trade_value_lag_1") - pl.col("trade_value_lag_2"))
                / pl.col("trade_value_lag_2")
            )
            .fill_nan(None)
            .alias("growth_lag_1"),
            over_group.shift(1).rolling_mean(3).over(KEYS).alias("rolling_mean_3"),
            over_group.shift(1).rolling_std(3).over(KEYS).alias("rolling_std_3"),
        )
        .drop_nulls(["trade_value_lag_1", "target"])
    )
