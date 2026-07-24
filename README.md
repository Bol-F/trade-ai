# TradeGraph AI

TradeGraph AI is an open, self-hosted platform for exploring international trade
flows. It turns BACI-compatible trade records into searchable catalogs, charts,
maps, risk indicators, anomaly reports, forecasts, and supplier suggestions.

The current repository is a complete MVP built around a small synthetic dataset.
It demonstrates the complete workflow without requiring paid data, an external
AI provider, or an external LLM.

## What can it be used for?

TradeGraph AI can help:

- trade analysts explore imports, exports, products, countries, and partners;
- businesses compare suppliers and investigate supply concentration;
- researchers inspect historical trends and transparent anomaly signals;
- policy teams monitor trade exposure without treating it as a complete
  economic or national-security risk score;
- data teams test a reproducible BACI ingestion and analytics architecture;
- developers experiment with locally trained forecasting and anomaly models.

Example questions include:

- How has trade in a product changed over time?
- Which countries supply most of an importer's demand?
- Is an importer unusually dependent on one supplier?
- Which trade flows changed sharply from their historical pattern?
- Which alternative suppliers meet the project's transparent ranking rules?
- Does a trained forecast beat a simple previous-year or moving-average
  baseline?

## Included in the MVP

- Email authentication with secure JWT cookies and user/admin roles
- Country and HS92 product catalogs
- BACI-compatible CSV validation and year-partitioned Parquet processing
- PostgreSQL trade storage with versioned, resumable dataset ingestion
- Explorer charts, global trade map, and country/product profiles
- HHI concentration, growth, CAGR, volatility, and supply-exposure indicators
- Rule-based and Isolation Forest anomaly signals
- Baseline, Ridge, and gradient-boosting forecasts trained on project data
- Explainable supplier recommendations
- Saved analyses and an admin data-health dashboard
- REST API documentation, metrics, structured logs, tests, and Docker Compose

## How it works

```text
BACI CSV/ZIP
    -> Polars validation and transformation
    -> partitioned Parquet files
    -> PostgreSQL
    -> Django REST API
    -> Next.js charts, tables, and maps

Redis supports caching and Celery tasks.
MinIO provides S3-compatible local object storage.
```

## Technology

- Backend: Python 3.12, Django, Django REST Framework, Celery, Polars, PyArrow
- Data and cache: PostgreSQL, Redis, MinIO
- ML: scikit-learn models trained only on the project's own data
- Frontend: Next.js, TypeScript, Tailwind CSS, TanStack Query, ECharts, MapLibre
- Tooling: uv, Ruff, mypy, pytest, Vitest, Playwright, Docker Compose

## Run locally

See **[RUN_LOCAL.md](RUN_LOCAL.md)** for the short local setup.

After one-time setup, normal development uses two commands:

```powershell
# Terminal 1: Django API
uv run --env-file .env.local python apps/backend/manage.py runserver

# Terminal 2: Next.js frontend
npm run dev
```

The application opens at <http://localhost:3000> and API documentation is at
<http://localhost:8000/api/docs/>.

## Repository layout

```text
tradegraph-ai/
├── apps/backend/             Django API, Celery, domain modules
├── apps/frontend/            Next.js web application
├── packages/data_pipeline/   BACI validation, Parquet, PostgreSQL loading
├── packages/ml/              Features, models, evaluation, artifacts
├── data/sample/              Synthetic BACI-compatible sample
├── docs/                     Architecture, security, data, and ML docs
├── compose.yml
├── pyproject.toml
└── uv.lock
```

## Important limitations

- Bundled records are synthetic test data and must not be used for real policy
  or commercial conclusions.
- The exposure score is a transparent trade-supply indicator, not a complete
  country, security, logistics, political, or financial risk score.
- Forecasts cannot anticipate policy changes, conflict, climate events,
  reporting revisions, or structural breaks.
- Full BACI data must be obtained and imported separately under its applicable
  terms.
- World Bank and UN Comtrade clients are optional; BACI functionality does not
  depend on paid API access.

More detail is available in
[the application documentation](tradegraph-ai/README.md) and
[architecture guide](tradegraph-ai/docs/architecture.md).
