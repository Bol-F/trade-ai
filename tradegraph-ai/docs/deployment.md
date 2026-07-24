# Deployment

1. Provision Docker hosts, managed PostgreSQL/Redis, TLS ingress and object storage.
2. Copy `.env.example` to a secret manager; set strong unique credentials and
   `DJANGO_SECRET_KEY`. Never deploy the example values.
3. Set `DJANGO_SETTINGS_MODULE=config.settings.production`, trusted hosts, the
   exact CORS origin allowlist, secure cookie settings and proxy HTTPS headers.
4. Build immutable backend/frontend images from the repository commit.
5. Run `python manage.py migrate` as a one-off release job.
6. Start backend, frontend, worker and beat; verify `/api/v1/health/ready`.
7. Import and validate BACI, then activate it explicitly.
8. Train/evaluate models only after data activation.
9. Scrape `/metrics`, centralize JSON logs, alert on readiness, failures and stale
   datasets, and back up PostgreSQL, Parquet and model artifacts.

Rollback uses the prior image plus `activate_dataset` for a retained ready dataset.
Database migrations must be backward-compatible during rolling deployment.
