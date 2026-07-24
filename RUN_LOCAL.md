# Run TradeGraph AI locally

The easiest development setup runs PostgreSQL and Redis in Docker, then runs
Django and Next.js directly on your computer.

## Install once

You need:

- Docker Desktop
- Python 3.12
- [uv](https://docs.astral.sh/uv/)
- Node.js 22 or newer

Clone the project and enter the application folder:

```powershell
git clone git@github.com:Bol-F/trade-ai.git
cd trade-ai\tradegraph-ai
```

All commands below run from the `tradegraph-ai` folder.

Install Python and frontend dependencies:

```powershell
uv sync --frozen
npm run install:frontend
```

Create the local settings file:

```powershell
Copy-Item .env.local.example .env.local
```

On Linux or macOS, use:

```bash
cp .env.local.example .env.local
```

Start PostgreSQL and Redis:

```powershell
docker compose --env-file .env.local up -d postgres redis
```

Create the database tables and import the sample:

```powershell
uv run --env-file .env.local python apps/backend/manage.py migrate
uv run --env-file .env.local python apps/backend/manage.py import_sample
```

## Start the program

Open two terminals in the `tradegraph-ai` folder.

Terminal 1 — backend:

```powershell
uv run --env-file .env.local python apps/backend/manage.py runserver
```

Terminal 2 — frontend:

```powershell
npm run dev
```

Open <http://localhost:3000>.

That is the normal daily workflow: start Docker Desktop, start PostgreSQL and
Redis, then run the two commands above.

## Useful links

- Application: <http://localhost:3000>
- API documentation: <http://localhost:8000/api/docs/>
- API health: <http://localhost:8000/api/v1/health/ready>

## Stop

Stop Django and Next.js with `Ctrl+C` in their terminals. Stop the supporting
containers with:

```powershell
docker compose --env-file .env.local stop postgres redis
```

## Run everything in Docker instead

If you do not want to run Python and npm directly:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose exec backend python manage.py import_sample
```

Open <http://localhost:3000>. Stop everything with:

```powershell
docker compose down
```

## Check the project

```powershell
uv run mypy .
uv run pytest
npm run lint
npm test
npm run build
```

## Common errors

### `mypy` or `package.json` was not found

You are probably in the outer `trade-ai` folder. Run:

```powershell
cd tradegraph-ai
```

Then retry the command.

### Django cannot connect to PostgreSQL or Redis

Make sure Docker Desktop is running, then start the services:

```powershell
docker compose --env-file .env.local up -d postgres redis
```

### `make` is not recognized

You do not need Make for this guide. Use the commands above directly.
