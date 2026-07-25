# Operations and observability

## Dashboard specification

| Panel | Signals | Alert example |
|---|---|---|
| API traffic | HTTP request count, duration percentiles, error count by route/status | 5xx >2% for 10m or p95 above SLO |
| Database | query duration, connections, lock waits, failed queries | p95 query latency doubled |
| Cache | hit, miss, error and hit-rate by analytics endpoint | hit rate below 50% or Redis unavailable |
| Celery | queue length/oldest age, task success/failure/runtime by task | oldest task >5m or failures >5% |
| Ingestion | duration, read/written/rejected rows, partial/failed state | rejected ratio or incomplete run |
| Forecast | duration, fallback count, interval/warning codes, artifact errors | artifact error or fallback spike |
| Exports | generation duration, pending/failed/expired count, bytes | pending beyond worker SLO |
| Active assets | active dataset and model version information metrics | unexpected change or none active |

Correlate requests/tasks with request ID, task ID, dataset version and model version.
Dashboards must not display secrets, request bodies, cookies, private download URLs, or
user email. Suggested SLOs: 99.9% API availability, p95 cached analytics under 750ms,
and 99% of small exports ready within 30 seconds.

## Failure behavior

Readiness fails when PostgreSQL is unavailable and reports Redis degradation without
leaking connection strings. Cache failures degrade to database calculation. Missing
dataset returns a clear unavailable state; missing model artifact returns a controlled
503 or quality baseline. External clients use timeouts/retries. Partial ingestion never
becomes active. Invalid cached data is schema rejected and recomputed. Frontend requests
surface nontechnical retry guidance. If Celery/object storage is unavailable, exports
remain pending/failed without revealing technical credentials.

Health endpoints: liveness proves the process runs; readiness verifies dependencies;
metrics is restricted at the network layer. Scale workers based on oldest queue age,
not CPU alone. Drain workers before deployment and avoid terminating ingestion during
database commits.
