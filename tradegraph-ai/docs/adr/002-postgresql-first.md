# ADR 002: PostgreSQL first

Status: Accepted

## Decision

Use PostgreSQL for metadata and initial trade analytics. Do not add ClickHouse yet.
Access large analytical facts through replaceable repository interfaces.

## Consequences

The MVP uses one durable database and avoids premature operational complexity.
Workloads and query plans will determine if and when ClickHouse is introduced.
