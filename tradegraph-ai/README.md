# TradeGraph AI

TradeGraph AI is an MVP foundation for a global trade analytics platform. This
repository intentionally contains infrastructure and application shells only:
authentication flows, trade data ingestion, analytics, and ML models are deferred.

## Architecture

- `apps/backend`: Django + DRF modular monolith, Celery, OpenAPI, health checks.
- `apps/frontend`: Next.js App Router frontend with TypeScript and Tailwind.
- `packages/data_pipeline`: reserved boundary for ingestion and Parquet transforms.
- `packages/ml`: reserved boundary for future forecasting and recommendation models.
- PostgreSQL is the system of record, Redis backs Celery, and MinIO stores data files.

## Prerequisites

Install Docker Desktop, GNU Make, Node.js 20.9+, and `uv`. Python is provisioned
as 3.12 by `uv`; a matching system Python is not required.

## Quick start

```bash
cp .env.example .env
make setup
make up
```

Open:

- Frontend: <http://localhost:3000>
- API docs: <http://localhost:8000/api/docs/>
- OpenAPI schema: <http://localhost:8000/api/schema/>
- MinIO console: <http://localhost:9001>

Run checks with `make test` and `make lint`. Stop services with `make down`.

## Local development without Docker

Start PostgreSQL and Redis, update `.env`, then:

```bash
uv sync
uv run python apps/backend/manage.py migrate
uv run python apps/backend/manage.py runserver
cd apps/frontend
npm ci
npm run dev
```

Never commit `.env`. The checked-in `.env.example` contains placeholders only.
