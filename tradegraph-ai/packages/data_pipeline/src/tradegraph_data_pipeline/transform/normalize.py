import polars as pl


def normalize_baci(frame: pl.DataFrame) -> pl.DataFrame:
    hs6 = pl.col("k").str.strip_chars().str.pad_start(6, "0")
    trade_value = pl.col("v") * 1000.0
    return frame.select(
        pl.col("t").cast(pl.Int32).alias("year"),
        pl.col("i").str.strip_chars().str.pad_start(3, "0").alias("exporter_code"),
        pl.col("j").str.strip_chars().str.pad_start(3, "0").alias("importer_code"),
        hs6.alias("hs6_code"),
        hs6.str.slice(0, 4).alias("hs4_code"),
        hs6.str.slice(0, 2).alias("hs2_code"),
        trade_value.alias("trade_value_usd"),
        pl.col("q").cast(pl.Float64).alias("quantity_tons"),
        pl.when(pl.col("q").is_not_null() & (pl.col("q") > 0))
        .then(trade_value / pl.col("q"))
        .otherwise(None)
        .alias("unit_value_usd_per_ton"),
    )
