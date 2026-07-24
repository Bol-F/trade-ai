# TradeGraph AI

TradeGraph AI is a self-hosted MVP for reproducible international-trade ingestion,
analytics, anomaly detection, forecasting, and supplier discovery. It uses no
external LLM and requires no paid API.

## New developer setup

Prerequisites: Docker Desktop with the Linux engine running, GNU Make, Git, Node
22+, and [`uv`](https://docs.astral.sh/uv/).

```bash
git clone git@github.com:Bol-F/trade-ai.git
cd trade-ai/tradegraph-ai
cp .env.example .env
make setup
make up
make migrate
make import-sample
```

Open:

- Application: <http://localhost:3000>
- Explorer: <http://localhost:3000/explorer>
- API documentation: <http://localhost:8000/api/docs/>
- OpenAPI schema: <http://localhost:8000/api/schema/>
- Metrics: <http://localhost:8000/metrics>
- MinIO console: <http://localhost:9001>

Stop with `make down`. View service output with `make logs`.

## Verification

```bash
make lint
make test
cd apps/frontend && npm run build && npm run test:e2e
cd ../..
docker compose build
uv run python scripts/check_secrets.py
```

## Sample and production data

The checked-in sample is synthetic test data:

```bash
make import-sample
```

Real BACI HS92 ZIP/CSV imports are streaming, partitioned by year, resumable and
inactive until explicitly promoted:

```bash
make import-baci FILE=/absolute/path/BACI_HS92.zip VERSION=202401 CHECKSUM=<optional-sha256>
make validate-dataset VERSION=202401
make activate-dataset VERSION=202401
```

`BACI_DOWNLOAD_URL` can configure a remote source. CI never downloads the full
dataset. Load matching country and HS92 metadata before a real import.

## Local ML workflow

All models train only on the active project dataset:

```bash
make build-features
make train-baseline
make train-forecast
make evaluate-models
```

Artifacts and evaluation reports persist in `artifacts/ml` or the Compose
`ml-artifacts` volume. A candidate activates only when its validation MAE beats
the selected moving-average baseline.

## Repository

```text
tradegraph-ai/
├── apps/backend/             Django, DRF, Celery
├── apps/frontend/            Next.js, ECharts, MapLibre, Playwright
├── packages/data_pipeline/   Polars/PyArrow BACI processing
├── packages/ml/              Features, sklearn models, evaluation, registry
├── data/sample/              Synthetic BACI-compatible fixture
├── docs/                     Architecture, security, deployment, methods
├── compose.yml
├── Makefile
├── pyproject.toml
└── uv.lock
```

## Limitations

- The bundled data is synthetic and cannot support real policy conclusions.
- Forecasts cannot anticipate policy, conflict, climate, reporting revisions or
  structural breaks.
- Exposure is a transparent trade-supply indicator, not a comprehensive
  national-security or economic-risk score.
- PostgreSQL is appropriate for the MVP; very large analytical workloads may
  later require ClickHouse.
- Prometheus counters are process-local unless deployed with a multiprocess-aware
  collector.

See [deployment](docs/deployment.md), [security](docs/security.md), and
[ML methodology](docs/ml-methodology.md) for operational details.
