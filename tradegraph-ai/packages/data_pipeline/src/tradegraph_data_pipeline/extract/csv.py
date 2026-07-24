from pathlib import Path

import polars as pl


def read_baci_csv(path: Path) -> pl.DataFrame:
    return pl.read_csv(
        path,
        schema_overrides={
            "t": pl.Int64,
            "i": pl.String,
            "j": pl.String,
            "k": pl.String,
            "v": pl.Float64,
            "q": pl.Float64,
        },
        null_values=["", "NA", "null"],
    )
