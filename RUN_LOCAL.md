# Run TradeGraph AI locally

This guide runs PostgreSQL and Redis in Docker while Django and Next.js run
directly on your computer. A Docker-only option is also included below.

## Requirements

Install:

- Docker Desktop with the Linux container engine
- Python 3.12
- [uv](https://docs.astral.sh/uv/)
- Node.js 22 or newer
- Git

Clone the repository:

```powershell
git clone git@github.com:Bol-F/trade-ai.git
cd trade-ai
```

The repository contains a convenience `package.json` at this level. Python,
Docker, database, and most maintenance commands run from `tradegraph-ai`:

```powershell
cd tradegraph-ai
```

## First-time setup

Create a local environment file from the safe template:

```powershell
Copy-Item .env.local.example .env.local
```

On Linux or macOS:

```bash
cp .env.local.example .env.local
```

`.env.local` is excluded from Git. Keep credentials and secrets in that file;
never add it to a commit.

Install dependencies:

```powershell
uv sync --frozen
npm run install:frontend
```

Start PostgreSQL and Redis:

```powershell
docker compose --env-file .env.local up -d postgres redis
docker compose --env-file .env.local ps
```

Apply database migrations and load the synthetic sample dataset:

```powershell
uv run --env-file .env.local python apps/backend/manage.py migrate
uv run --env-file .env.local python apps/backend/manage.py import_sample
```

The sample data is for demonstration and testing only.

## Start the application

Use two terminals.

Terminal 1, from `trade-ai\tradegraph-ai`:

```powershell
uv run --env-file .env.local python apps/backend/manage.py runserver
```

Terminal 2, from either `trade-ai` or `trade-ai\tradegraph-ai`:

```powershell
npm run dev
```

Open:

- Web application: <http://localhost:3000>
- API documentation: <http://localhost:8000/api/docs/>
- Readiness check: <http://localhost:8000/api/v1/health/ready>

Development settings allow the local health and metrics workflows. Production
uses stricter validation and requires production secrets such as
`METRICS_BEARER_TOKEN`.

## Daily workflow

After first-time setup:

```powershell
cd trade-ai\tradegraph-ai
docker compose --env-file .env.local up -d postgres redis
uv run --env-file .env.local python apps/backend/manage.py runserver
```

Run `npm run dev` in a second terminal.

## Stop the application

Stop Django and Next.js with `Ctrl+C`. Then stop supporting services:

```powershell
docker compose --env-file .env.local stop postgres redis
```

This preserves local database volumes. To remove containers while retaining
named volumes:

```powershell
docker compose --env-file .env.local down
```

Do not add `--volumes` unless you intentionally want to delete local service
data.

## Docker-only setup

From `trade-ai\tradegraph-ai`:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py import_sample
docker compose ps
```

Open <http://localhost:3000>. Stop the stack with:

```powershell
docker compose down
```

The `.env` file is local and must not be committed.

## Validate the project

Run from `trade-ai\tradegraph-ai`:

```powershell
uv run ruff check .
uv run mypy .
uv run pytest
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm --prefix apps/frontend audit --omit=dev --audit-level=high
```

Run browser tests after the application dependencies are installed:

```powershell
npm run test:e2e
```

## Troubleshooting

### Docker daemon is unavailable

Start Docker Desktop and wait for its Linux engine to become ready. Then:

```powershell
docker compose --env-file .env.local up -d postgres redis
```

### Django cannot connect to PostgreSQL or Redis

Confirm the containers are healthy:

```powershell
docker compose --env-file .env.local ps
docker compose --env-file .env.local logs postgres redis
```

Check that `.env.local` exists in `tradegraph-ai` and that its host names and
ports match the local setup.

### `package.json`, `pyproject.toml`, or `manage.py` is not found

Check your current directory:

```powershell
Get-Location
```

Use `trade-ai` for the root npm convenience commands. Use
`trade-ai\tradegraph-ai` for Python, Docker, and direct application commands.

### A port is already in use

The default ports are:

- `3000` for Next.js
- `8000` for Django
- `5432` for PostgreSQL
- `6379` for Redis

Stop the conflicting process or update the matching local environment setting.

### Authentication requests fail with CSRF errors

Use the application frontend or obtain a CSRF cookie from
`/api/v1/auth/csrf` before making cookie-authenticated write requests. API
clients using an `Authorization: Bearer` header do not use browser CSRF cookies.

## Production warning

The local environment files are development templates. Do not deploy them as
production configuration. Before deployment, follow
[the deployment guide](tradegraph-ai/docs/deployment.md) and
[security guide](tradegraph-ai/docs/security.md).
