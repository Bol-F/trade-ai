# Performance audit

Audit date: 2026-07-25  
Dataset: bundled `sample-v1` (40 annual flows, 5 countries, 5 products)  
Environment: local PostgreSQL 16 and Redis 7 on Windows

## Baseline

Before changes, all 58 backend tests and 7 frontend tests passed. PostgreSQL and
Redis were healthy. The audit inspected every public ORM-backed endpoint and the
TanStack Query call sites.

The main scaling defects found were:

- anomaly calculation issued one supplier aggregation per year (`4 + N years`
  SQL queries, 12 for the eight-year sample);
- country profiles recalculated concentration three times and separately queried
  import/export totals (11 SQL queries);
- country catalog data used different frontend query keys in Explorer and the
  catalog, so navigation could download the same list twice;
- every query was immediately stale and could refetch on focus/navigation;
- cache errors could fail an analytical request and cache effectiveness was not
  observable;
- an unbounded requested year range could scan all retained history;
- exporter/importer indexes did not lead with `dataset_version`, despite every
  normal analytical request first selecting the active dataset;
- HTTP responses had no application-level compression.

No candidate-level N+1 was found in supplier recommendations: histories and
existing relationships are fetched in two set queries. Country/product lists
were already paginated at 25 records, product serializers already used
`select_related("classification")`, saved analyses filtered ownership in one
query, active models used `select_related("dataset_version")`, and map responses
were already aggregated and capped at 100 arcs.

## Changes

### ORM and analytical queries

Anomaly supplier shares now use one grouped `year, exporter` query and calculate
the per-year maximum from those aggregate rows. Query count is now five,
independent of the number of years.

Country profiles now:

- calculate import/export totals with conditional SQL aggregates;
- calculate concentration once and reuse it for suppliers and exposure;
- fetch import history once and reuse values and quantities.

The uncached profile now uses seven queries, independent of partner/product
cardinality. Supplier recommendations remain at three queries and the active
model registry remains at one.

### Indexes

Migration `trade.0003_dataset_partner_year_indexes` replaces:

- `(exporter, year)` with `(dataset_version, exporter, year)`;
- `(importer, year)` with `(dataset_version, importer, year)`.

These support active-dataset country profiles, partner filtering, forecasts and
supplier relationship checks. Existing four-column dataset/partner/HS2/year
indexes remain for product-specific paths. No additional overlapping HS2 index
was added, avoiding unnecessary ingestion cost.

On the 40-row fixture PostgreSQL correctly prefers a sequential scan. The
representative grouped supplier plan was:

```text
GroupAggregate
  -> Sort (quicksort, 25 kB)
    -> Nested Loop
      -> Seq Scan on trade_annualtradeflow (40 rows)
      -> Index Scan on catalog_country iso3 index
Planning Time: 1.712 ms
Execution Time: 0.108 ms
```

Before the fix, that supplier scan was executed once for each year. After the
fix, one grouped scan produces all year/exporter values. The new composite
indexes are not expected to be chosen for a 40-row table; their benefit must be
rechecked with full BACI cardinality using `EXPLAIN (ANALYZE, BUFFERS)`.

### API, cache and frontend

- Requests spanning more than 50 years now return HTTP 400, including ranges
  with only one boundary supplied.
- Map data remains country-arc aggregates only, with `top` constrained to
  1–100.
- GZip middleware compresses eligible API responses. The sample map response
  changed from 1,150 bytes to 473 bytes over gzip (59% smaller). The logical JSON
  schema is unchanged.
- Analytics caches retain dataset version, endpoint, normalized filters,
  aggregation level, and top/pagination values in their keys. Dataset promotion
  changes the version and therefore makes all old entries unreachable.
- Empty values remain cacheable because cache misses are distinguished with
  `None`.
- Cache get/set failures now fall back to normal calculation.
- Prometheus exposes
  `tradegraph_analytics_cache_requests_total{endpoint,result}` for hit, miss and
  error outcomes.
- Shared catalog query-key factories remove the Explorer/country-list mismatch.
- Default query freshness is five minutes, garbage collection is 30 minutes,
  and window-focus refetching is disabled. TanStack Query continues to
  deduplicate concurrent requests with identical keys.

## After-change measurements

`python manage.py performance_smoke --iterations 10` was run against local
PostgreSQL and Redis. Warm p95 includes Django test-client overhead.

| Endpoint | Uncached SQL | Uncached ms | Warm p95 ms | JSON bytes |
|---|---:|---:|---:|---:|
| countries | 2 | 22.61 | 5.23 | 1,133 |
| products | 2 | 7.78 | 5.47 | 1,189 |
| trade overview | 4 | 10.45 | 6.48 | 248 |
| time series | 2 | 4.46 | 4.52 | 660 |
| partners | 2 | 5.14 | 5.04 | 554 |
| map | 2 | 6.45 | 6.46 | 1,150 |
| anomalies | 5 | 124.57 | 4.41 | 1,793 |
| country profile | 7 | 11.83 | 4.36 | 1,383 |
| product profile | 11 | 126.72 | 4.86 | 2,740 |
| forecast | 3 | 8.78 | 6.68 | 663 |
| supplier recommendations | 3 | 6.41 | 6.36 | 474 |

Measured query-count comparison:

| Path | Before | After |
|---|---:|---:|
| anomalies, eight years | 12 | 5 |
| anomalies, N years | `4 + N` | 5 |
| country profile | 11 | 7 |
| supplier recommendations | 3 | 3 |
| active models | 1 | 1 |
| populated paginated catalog | 2 | 2 |

All sample targets are met: metadata p95 is below 500 ms, cached analytics p95
is below 500 ms, and uncached common endpoints are below two seconds. These
numbers are not full-BACI capacity claims.

## Regression coverage

Performance tests now cover stable query counts for growing country, product,
saved-analysis, dataset-health and model lists; bounded supplier/profile query
counts; top-N map payloads; gzip; payload size; and maximum date ranges.
Frontend tests cover stable shared query keys and metadata freshness defaults.
The `performance_smoke` command makes endpoint measurements reproducible.

## Remaining bottlenecks

- Product profile still performs 11 set-based queries and locally fits an
  Isolation Forest. At 126.72 ms it meets the sample target, but should be the
  first endpoint retested on full BACI data.
- Anomaly Isolation Forest training occurs during an uncached request. A future
  scale step should precompute/version anomaly artifacts, without changing the
  current MVP architecture prematurely.
- HHI and exposure consume grouped supplier/year results in Python. They do not
  load raw flow rows, but high-cardinality full data may justify materialized
  aggregates.
- The sample is too small for PostgreSQL to choose the new composite indexes or
  provide meaningful disk-I/O plans. Production validation needs representative
  data volume and concurrent HTTP load.
- The smoke command covers public endpoints. Saved analyses and admin data
  health are protected by query-count regression tests rather than latency
  measurements.
