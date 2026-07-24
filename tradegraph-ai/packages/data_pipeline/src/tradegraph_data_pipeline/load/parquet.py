from pathlib import Path

import polars as pl
import pyarrow.dataset as ds


def write_partitioned_parquet(frame: pl.DataFrame, destination: Path) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    ds.write_dataset(
        frame.to_arrow(),
        base_dir=str(destination),
        format="parquet",
        partitioning=["year"],
        partitioning_flavor="hive",
        existing_data_behavior="delete_matching",
    )
    return destination
