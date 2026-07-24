# Running TradeGraph AI locally

This guide starts the complete MVP with Docker Compose and imports the bundled
synthetic sample dataset. No paid API, external LLM, or full BACI download is
required.

## 1. Prerequisites

Install:

- Git
- Docker Desktop with its Linux container engine running
- Python 3.12
- [`uv`](https://docs.astral.sh/uv/)
- Node.js 22 or newer

GNU Make is optional. Windows users can use the included PowerShell runner.

Confirm the main tools:

```powershell
git --version
docker version
docker compose version
uv --version
node --version
npm --version
```

## 2. Clone and enter the application workspace

```powershell
git clone git@github.com:Bol-F/trade-ai.git
cd trade-ai\tradegraph-ai
```

The second command is important. `pyproject.toml`, `package.json`, `compose.yml`,
and the Makefile are inside `tradegraph-ai`, not at the outer Git checkout root.

## 3. Windows PowerShell setup

PowerShell may block local scripts in some environments. Allow scripts for only
the current terminal session if needed:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Install dependencies, create `.env`, and start the infrastructure:

```powershell
.\scripts\dev.ps1 setup
.\scripts\dev.ps1 up
.\scripts\dev.ps1 migrate
.\scripts\dev.ps1 import-sample
```

The `setup` command uses `uv sync` for Python and `npm ci` for the frontend.

## 4. Linux and macOS setup

From the `tradegraph-ai` directory:

```bash
cp .env.example .env
make setup
make up
make migrate
make import-sample
```

If GNU Make is unavailable, run the underlying commands:

```bash
uv sync --frozen
npm run install:frontend
docker compose up --build -d
uv run python apps/backend/manage.py migrate
uv run python apps/backend/manage.py import_sample
```

## 5. Open the application

- Web application: <http://localhost:3000>
- API documentation: <http://localhost:8000/api/docs/>
- OpenAPI schema: <http://localhost:8000/api/schema/>
- Readiness endpoint: <http://localhost:8000/api/v1/health/ready>
- Metrics: <http://localhost:8000/metrics>
- MinIO console: <http://localhost:9001>

## 6. Verify the local checkout

Run these from `tradegraph-ai`:

```powershell
uv run ruff check .
uv run mypy .
uv run pytest
npm run lint
npm test
npm run build
```

Windows users can run the combined checks with:

```powershell
.\scripts\dev.ps1 lint
.\scripts\dev.ps1 test
```

Linux and macOS users can run:

```bash
make lint
make test
```

## 7. Common operations

Windows PowerShell:

```powershell
.\scripts\dev.ps1 logs
.\scripts\dev.ps1 down
.\scripts\dev.ps1 import-baci -File C:\data\BACI_HS92.zip -Version 2024
.\scripts\dev.ps1 validate-dataset -Version 2024
.\scripts\dev.ps1 activate-dataset -Version 2024
```

GNU Make:

```bash
make logs
make down
make import-baci FILE=/data/BACI_HS92.zip VERSION=2024
make validate-dataset VERSION=2024
make activate-dataset VERSION=2024
```

## 8. Troubleshooting

### `uv run mypy .` says mypy was not found

You are probably in the outer repository directory. Enter the application
workspace and synchronize its environment:

```powershell
cd tradegraph-ai
uv sync --frozen
uv run mypy .
```

### npm reports that `package.json` cannot be found

Run npm from `tradegraph-ai`, not the outer checkout root:

```powershell
cd tradegraph-ai
npm run install:frontend
npm test
```

The project-level npm commands forward to `apps/frontend`.

### `make` is not recognized on Windows

Make is not installed with Windows. Use:

```powershell
.\scripts\dev.ps1 setup
.\scripts\dev.ps1 up
```

### Docker commands cannot connect to the engine

Start Docker Desktop, select Linux containers, wait until the engine reports it
is running, and retry:

```powershell
docker compose up --build -d
```

### Reset only the project containers

```powershell
docker compose down
docker compose up --build -d
```

Persistent PostgreSQL, Redis, and MinIO volumes are retained by default.
