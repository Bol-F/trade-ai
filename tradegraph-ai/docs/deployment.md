# Production deployment

TradeGraph AI deploys as a Next.js frontend, Django API, PostgreSQL, Redis, Celery
worker/beat, and optional S3-compatible object storage. Production must never use sample
data or development secrets.

## Required environment

`DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`,
`AUTH_COOKIE_SECURE=true`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_HOST`, `POSTGRES_PORT`, `REDIS_URL`, `NEXT_PUBLIC_API_URL`. Source-specific
credentials include `UN_COMTRADE_API_KEY`; never expose it to the frontend or logs.
Configure `BACI_DOWNLOAD_URL`, external timeouts, object-store endpoint/bucket/access
credentials, email-free operational alerting, and retention values where those features
are enabled.

## Release procedure

1. Back up PostgreSQL and object storage; record active dataset/model versions.
2. Build immutable backend and frontend images; run Python tests, frontend tests, lint,
   Next build, `manage.py check --deploy`, migration checks, and dependency audits.
3. Apply `manage.py migrate` from one release job.
4. Deploy API, then workers, then frontend. Do not allow mixed task code versions.
5. Verify `/health/live`, `/health/ready`, `/metrics`, login, Explorer, forecast fallback,
   export authorization, and an owner-isolation check.
6. Promote traffic gradually and observe error rate, latency, DB/cache health and queues.

Rollback application images first. If a migration is backward compatible, leave it in
place; otherwise follow its reviewed reverse migration after restoring a backup. Dataset
rollback uses the lifecycle promotion command. Model rollback uses the audited registry
rollback service. Never roll back by deleting records.

Scale stateless API/frontend replicas independently. Scale Celery by queue and measured
queue latency; ingestion and exports should have separate concurrency limits. A failed
deployment is restored by returning to the last image, restoring configuration, running
health checks, and—only if data changed incompatibly—restoring PostgreSQL/object backups.
