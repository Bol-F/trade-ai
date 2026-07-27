# TradeGraph AI frontend and design-system audit

## Scope

This audit establishes a reusable visual foundation without redesigning product pages or changing
trade-data, authentication, API, ML, routing, or deployment behavior. Despite the broader “Trade AI”
brief, the implemented product is an international-trade intelligence platform, so financial styling
must support evidence-led trade analytics rather than imply brokerage, execution, or investment
services that the application does not provide.

## Architecture inventory

| Area | Current implementation | Design-system implication |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19.2, TypeScript strict mode | Preserve Server Component route shells and keep interactivity in leaf client components. |
| Routing | 20 App Router routes including dynamic country, product, and methodology detail routes | No route changes are required for the foundation. |
| Styling | Tailwind CSS 4, CSS variables in `globals.css`, dark mode through `next-themes` | Centralize semantic tokens and expose them through Tailwind theme variables. |
| Components | Owned shadcn-style source using unified `radix-ui`; 13 primitives plus composed analytics states | Extend existing primitives; do not introduce another component library. |
| Icons | Lucide React | Continue using Lucide only, at consistent 16/20px sizes. |
| Charts and maps | ECharts 6 and MapLibre GL 6 | Wrap chart presentation in semantic, accessible containers; preserve data transforms. |
| Server state | TanStack Query with shared defaults | Do not replace query state or API caching. |
| Local state | Colocated React state; i18n and auth contexts | Preserve provider order and hydration behavior. |
| API integration | Typed `fetch` client validated with Zod | Preserve endpoints, schemas, credentials, refresh behavior, and errors. |
| Authentication | Django cookie JWT, refresh endpoint, CSRF token/header enforcement | Do not move auth into middleware or expose tokens to JavaScript storage. |
| Responsive behavior | Mobile sheets, responsive grids, 65 responsive utility uses, horizontal table containers | New primitives must provide 44px touch targets and mobile-safe overflow. |
| Testing | Vitest/Testing Library and Playwright | Add behavioral and accessibility assertions for new primitives. |
| Lint/format/type | ESLint Core Web Vitals, strict TypeScript, Prettier script | Use existing scripts; type checking is `npx tsc --noEmit` because no package script exists. |
| Backend | Django REST modular monolith, PostgreSQL, Redis, Celery, data and ML workspaces | No backend or database changes are in scope. |
| Deployment | Standalone Next.js and Django Docker images orchestrated with Compose | Tokens and components must remain build-time environment independent. |
| CI | GitHub Actions backend, frontend, and Docker jobs on pushes and pull requests | All three jobs must pass before merge. |

## Existing strengths

- Theme-based surface, text, border, focus, and destructive colors already exist.
- Geist Sans and Geist Mono are configured correctly for Tailwind 4.
- Reduced-motion behavior, a skip link, semantic page headers, accessible empty/error states, and
  textual risk labels are present.
- Tables provide overflow containment and the navigation has dedicated desktop/mobile behavior.
- React Query, authentication, API validation, i18n, charts, and maps are separated from base UI.

## Gaps and risks

1. Brand and semantic tokens are incomplete. Spacing, typography, elevation, motion, z-index,
   informational, warning, success, and financial-number conventions are not centrally expressed.
2. The current light/dark palette is teal-led and does not implement the requested navy, electric
   blue, and emerald system.
3. Several warning/success treatments use raw Tailwind palette colors, which weakens consistency.
4. Button, input, and select states need stronger focus, loading, touch-target, and invalid behavior.
5. Missing reusable primitives include icon button, search input, checkbox, radio group, switch,
   dialog/modal, alert, progress, pagination, status badge, confidence indicator, and chart
   container. Toast infrastructure is intentionally deferred until a product mutation consumes it;
   shipping a global live region without a consumer would add unused client state.
6. Analytics-specific components currently share one large `design-system.tsx` module. This task
   will improve APIs and semantic tokens without a risky page-by-page migration.
7. The default theme follows the operating system. A dark-first premium dashboard foundation should
   be the default while retaining the user-controlled light theme.

## Implementation plan

1. Expand `globals.css` into documented light/dark semantic tokens for brand, surfaces, status,
   typography, spacing, radius, shadows, motion, containers, and stacking. Preserve current token
   names so existing pages inherit the redesign safely.
2. Harden existing button/input/select/card/badge/table/tab/skeleton primitives for accessible
   states and consistent density.
3. Add the missing reusable interaction primitives using the existing unified Radix dependency.
4. Add TradeGraph-specific status, metric, risk, confidence, loading, and chart compositions backed
   by semantic tokens and text/icon cues.
5. Add focused tests for keyboard-visible semantics, loading/disabled behavior, textual status
   communication, and bounded financial indicators.
6. Run the actual repository checks, push the feature branch, resolve CI failures, and merge only
   after frontend, backend, and Docker jobs are green.

## Explicit non-goals

- No page-level information architecture redesign.
- No API, authentication, database, ML, routing, or environment-variable changes.
- No replacement of Tailwind, Radix/shadcn, Lucide, TanStack Query, ECharts, or MapLibre.
- No fabricated trading, portfolio, price, or investment functionality.
