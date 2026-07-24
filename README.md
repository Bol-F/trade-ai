# TradeGraph AI

The application is in [`tradegraph-ai`](tradegraph-ai/README.md).

## Start here

```powershell
git clone git@github.com:Bol-F/trade-ai.git
cd trade-ai\tradegraph-ai
Copy-Item .env.example .env
uv sync --frozen
npm run install:frontend
```

On Windows, GNU Make is not installed by default. Use the PowerShell runner:

```powershell
.\scripts\dev.ps1 setup
.\scripts\dev.ps1 up
.\scripts\dev.ps1 migrate
.\scripts\dev.ps1 import-sample
```

Verification commands from the `tradegraph-ai` directory:

```powershell
uv run mypy .
npm run lint
npm test
.\scripts\dev.ps1 test
```

Linux and macOS developers with GNU Make can use the equivalent commands:

```bash
make setup
make up
make migrate
make import-sample
make lint
make test
```

See the [complete project README](tradegraph-ai/README.md) for architecture,
data-import, ML, deployment, and operational documentation.
