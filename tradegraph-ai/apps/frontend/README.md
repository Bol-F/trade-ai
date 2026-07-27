# TradeGraph AI frontend

This directory contains the Next.js App Router application for TradeGraph AI.
It provides the public landing experience, authentication, international-trade
analysis pages, and the authenticated portfolio-style dashboard.

Dashboard market prices, holdings, signals, and alerts are illustrative demo
data until matching backend services are implemented. Authentication, account
identity, password changes, saved analyses, and international-trade APIs use the
real Django backend.

## Requirements

- Node.js 22 or newer
- npm (the committed `package-lock.json` is authoritative)
- The Django API at `http://localhost:8000`, unless
  `NEXT_PUBLIC_API_URL` points elsewhere

Install reproducibly:

```powershell
npm ci
```

Start development:

```powershell
npm run dev
```

Open <http://localhost:3000>. For database, sample-data, and backend setup, see
[the repository local-development guide](../../../RUN_LOCAL.md).

## Environment

Copy the repository-level safe template before starting the full stack:

```powershell
Copy-Item ..\..\.env.local.example ..\..\.env.local
```

Only variables prefixed with `NEXT_PUBLIC_` are exposed to browser code. Do not
place credentials, private API keys, signing secrets, or database passwords in
those variables.

Common public configuration:

- `NEXT_PUBLIC_API_URL` — Django API origin
- `NEXT_PUBLIC_MAP_TILE_URL` — trusted raster tile URL template

## Validation

Run before opening a pull request:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Playwright starts the previously built production server. Run `npm run build`
before `npm run test:e2e`. Browser coverage includes authentication, dashboard
interactions, automated WCAG checks, unauthorized behavior, and the required
desktop, tablet, and mobile breakpoints.

## Production

Build and run the standalone-compatible application:

```powershell
npm ci
npm run build
npm run start
```

Set the production API and map origins before building because public
environment variables are embedded in the browser bundle. The application
ships CSP, frame, content-type, referrer, and permissions headers from
`next.config.ts`; preserve equivalent headers if a reverse proxy overrides
them.

The frontend container can be built from `tradegraph-ai` with:

```powershell
docker build apps/frontend
```

For the full production stack, secret requirements, TLS, backups, health
checks, and rollback guidance, follow
[the deployment guide](../../docs/deployment.md) and
[security guide](../../docs/security.md).
