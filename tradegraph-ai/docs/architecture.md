# Architecture

TradeGraph AI starts as a modular monolith: a single Django deployment with explicit
domain apps and a separate Next.js user interface. This minimizes operational cost
while preserving boundaries that can later become services.

PostgreSQL is the transactional and initial analytical store. Query code should live
behind domain services/repositories rather than spread through views, allowing a
ClickHouse-backed implementation to be introduced later without changing the API.
Redis supplies ephemeral coordination and Celery transport. MinIO holds immutable
Parquet datasets; metadata and object locations belong in PostgreSQL.

The `data_pipeline` and `ml` packages are intentionally empty public boundaries.
They must not import Django presentation code. Celery tasks will eventually call
their application services, keeping long-running work outside web requests.

All public HTTP APIs are versioned beneath `/api/v1/`. Liveness checks only process
availability; readiness verifies mandatory PostgreSQL and Redis dependencies.
