# ADR 003: Parquet for data files

Status: Accepted

## Decision

Store imported and transformed bulk datasets as immutable Parquet objects in
S3-compatible storage, with provenance and object metadata in PostgreSQL.

## Consequences

Columnar files are portable and efficient for batch processing. Object immutability
supports reproducibility; lifecycle and schema-version policies will be needed.
