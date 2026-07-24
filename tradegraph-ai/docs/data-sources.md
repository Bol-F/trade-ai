# Data sources

## BACI HS92

BACI is the primary trade source. The importer accepts a configured local CSV/ZIP
or URL, verifies SHA-256 when supplied, scans lazily, processes one year at a time,
writes year-partitioned Parquet, and batch-writes PostgreSQL. Ingestion checkpoints
record completed years for restart. Production files and licenses are not included.

The repository sample follows `t,i,j,k,v,q` but is explicitly synthetic.

## World Bank

Disabled by use rather than credentials and requires no API key. Only indicators
in `WORLD_BANK_INDICATORS` can be requested. Responses use timeouts, retries,
Redis caching and provenance metadata.

## UN Comtrade

Optional and disabled when `UN_COMTRADE_API_KEY` is empty. The client applies a
minimum interval, exponential retry, daily request counter, and last-request
checkpoint. BACI ingestion is independent and continues without Comtrade.
