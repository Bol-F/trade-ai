# TradeGraph AI

TradeGraph AI is a self-hosted platform for exploring international trade data.
It converts BACI-compatible records into searchable country and product
profiles, interactive charts and maps, concentration indicators, anomaly
signals, forecasts, and explainable supplier suggestions.

The repository contains a complete MVP and a small synthetic dataset, so the
main workflow can be evaluated without paid data or an external AI service.

## Purpose

TradeGraph AI helps analysts, businesses, researchers, and policy teams answer
questions such as:

- How have imports or exports changed over time?
- Which partners supply most of a country's demand?
- Is a market unusually dependent on one supplier?
- Which trade flows differ sharply from their historical pattern?
- Which alternative suppliers satisfy transparent ranking rules?
- Does a trained forecast outperform a simple baseline?

The program is an analytical aid. Its exposure scores, anomaly signals,
forecasts, and supplier rankings are not financial, legal, policy, or
national-security advice.

## Main capabilities

- Secure email authentication with short-lived JWT cookies and user/admin roles
- Country and HS92 product catalogs
- BACI-compatible CSV and ZIP validation
- Partitioned Parquet processing and resumable PostgreSQL ingestion
- Trade explorer, world map, and country and product profiles
- Growth, CAGR, volatility, HHI concentration, and supply-exposure indicators
- Rule-based and Isolation Forest anomaly detection
- Baseline, Ridge, and gradient-boosting forecasts
- Explainable supplier recommendations
- Saved analyses and administrative data-health views
- REST API documentation, metrics, structured logs, and automated tests

## Architecture

```text
BACI CSV or ZIP
        |
        v
Polars validation and transformation
        |
        v
Partitioned Parquet -> PostgreSQL
                           |
                           v
                    Django REST API
                           |
                           v
                    Next.js frontend
```

Redis supports caching and Celery tasks. MinIO provides S3-compatible object
storage for local and production-like environments.

## Technology

- Backend: Python 3.12, Django, Django REST Framework, Celery
- Data: PostgreSQL, Polars, PyArrow, Redis, MinIO
- Machine learning: scikit-learn
- Frontend: Next.js, TypeScript, Tailwind CSS, TanStack Query, ECharts, MapLibre
- Quality: Ruff, mypy, pytest, Vitest, Playwright, Docker Compose

## Quick start

Install Docker Desktop, Python 3.12, uv, and Node.js 22 or newer. Then:

```powershell
cd tradegraph-ai
Copy-Item .env.local.example .env.local
uv sync --frozen
npm run install:frontend
docker compose --env-file .env.local up -d postgres redis
uv run --env-file .env.local python apps/backend/manage.py migrate
uv run --env-file .env.local python apps/backend/manage.py import_sample
```

Start the backend:

```powershell
uv run --env-file .env.local python apps/backend/manage.py runserver
```

From a second terminal, start the frontend from either repository directory:

```powershell
npm run dev
```

Open <http://localhost:3000>. API documentation is available at
<http://localhost:8000/api/docs/>.

For complete setup, troubleshooting, Docker-only instructions, and validation
commands, read [RUN_LOCAL.md](RUN_LOCAL.md).

## Repository layout

```text
.
|-- README.md
|-- RUN_LOCAL.md
|-- package.json
`-- tradegraph-ai/
    |-- apps/backend/             Django API and domain modules
    |-- apps/frontend/            Next.js web application
    |-- packages/data_pipeline/   Validation and ingestion pipeline
    |-- packages/ml/              Features, models, and evaluation
    |-- data/sample/              Synthetic demonstration data
    |-- docs/                     Architecture and operational guides
    |-- compose.yml
    |-- pyproject.toml
    `-- uv.lock
```

## Security

The application includes:

- CSRF protection for browser authentication and cookie-authenticated writes
- scoped, HTTP-only JWT cookies
- strict API input validation
- SSRF-resistant external downloads with host allowlists
- archive size and compression-ratio limits
- authenticated production metrics
- security headers and production configuration checks
- automated dependency and security-focused tests

Production secrets must be supplied through environment variables. Never commit
`.env`, `.env.local`, credentials, private keys, database dumps, or real trade
data. See [the security guide](tradegraph-ai/docs/security.md) and
[deployment guide](tradegraph-ai/docs/deployment.md) before deployment.

## Testing

Run these commands from `tradegraph-ai`:

```powershell
uv run ruff check .
uv run mypy .
uv run pytest
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

End-to-end browser tests are available in `apps/frontend/e2e`.

## Data and model limitations

- Bundled records are synthetic and must not support real commercial or policy
  conclusions.
- Full BACI data must be obtained separately under its applicable terms.
- Supply exposure is narrower than complete geopolitical, logistics,
  counterparty, financial, or operational risk.
- Forecasts cannot anticipate conflict, policy changes, climate events,
  structural breaks, or reporting revisions.
- Machine-learning output depends on the coverage and quality of imported data.

More technical detail is available in
[the application README](tradegraph-ai/README.md) and
[architecture guide](tradegraph-ai/docs/architecture.md).
