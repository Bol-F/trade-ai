# ADR 001: Modular monolith

Status: Accepted

## Decision

Use one Django deployment divided into domain apps. Keep data-pipeline and ML code
in separate Python package boundaries.

## Consequences

The MVP has simple transactions and operations. Domain ownership remains visible,
and independently scalable services can be extracted when measurements justify it.
