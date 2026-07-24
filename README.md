# TradeGraph AI

TradeGraph AI is a self-hosted international-trade analytics MVP. The application
workspace is in [`tradegraph-ai`](tradegraph-ai/README.md).

## Quick start

```powershell
git clone git@github.com:Bol-F/trade-ai.git
cd trade-ai\tradegraph-ai
.\scripts\dev.ps1 setup
.\scripts\dev.ps1 up
.\scripts\dev.ps1 migrate
.\scripts\dev.ps1 import-sample
```

Open <http://localhost:3000>.

All Python and npm commands must be run from the `tradegraph-ai` directory:

```powershell
uv run mypy .
npm run lint
npm test
```

See [RUN_LOCAL.md](RUN_LOCAL.md) for complete Windows, Linux, and macOS setup
instructions and troubleshooting.
