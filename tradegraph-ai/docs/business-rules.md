# TradeGraph AI business rules

This document is the normative correctness contract for the MVP. Monetary values
are current USD unless a source explicitly states otherwise. The bundled sample
is synthetic and cannot support commercial or policy conclusions.

## Trade ingestion

| Rule | Inputs and formula | Null/zero/error behavior | Example |
|---|---|---|---|
| Orientation | BACI `i` is exporter; BACI `j` is importer. This mapping is never reversed. | Missing or unknown country codes reject the input. | `i=860,j=156` means Uzbekistan exports to China. |
| Trade value | `trade_value_usd = BACI v × 1,000`. Conversion occurs only in raw BACI normalization. | Null or negative `v` rejects the row; zero is valid. | `v=12.25` becomes USD 12,250. |
| Quantity | BACI `q` is metric tons. | Missing stays null; zero stays zero; negative rejects the row. Aggregates are null when every contributing quantity is null. | null remains null. |
| Unit value | `trade_value_usd / quantity_tons`. | Calculated only for quantity greater than zero. Null or zero quantity produces null, never infinity. | USD 12,250 / 2 t = USD 6,125/t. |
| HS codes | Normalize to a six-character digit string with left zero padding; HS4 and HS2 are string prefixes. | Null, non-digit, or longer/invalid codes reject the row. | `10121` becomes `010121`; HS2 is `01`. |
| Duplicates | Natural key is dataset, year, exporter, importer and HS6. Source-file duplicates reject validation. Retry rows are accepted only when stored values are identical. | Conflicting retry values raise an error; they are never added or silently ignored. | Replaying the same 2024 row writes zero new rows. |

Database decimal scales are USD 0.01, quantity 0.001 t, and unit value
0.0001 USD/t. Values are quantized once before comparison and insertion.

## Filters and aggregation

Every analytical query starts from exactly one dataset with both `ready` and
`is_active` set. Dataset version is always in the SQL predicate. Incomplete,
failed and archived datasets cannot be selected.

- `importer=AAA` selects rows whose importer is AAA.
- `exporter=AAA` selects rows whose exporter is AAA.
- Supplying both selects the exact directed lane. Equal importer/exporter codes
  are allowed and mean explicitly reported self-trade; they are not reinterpreted.
- No product selects every product. Product accepts exactly 2, 4 or 6 digits and
  maps to HS2, HS4 or HS6 respectively. Leading zeros are significant.
- Years are inclusive. Equal start/end selects one year. A range may not exceed
  50 years. Years outside coverage return an empty result, not fabricated zeros.
- `direction=imports` requires importer; `direction=exports` requires exporter.
  Direction is a validation aid and does not reverse a lane.
- Only annual aggregation is supported. Unsupported aggregation and non-active
  dataset versions return HTTP 400 `VALIDATION_ERROR`.

Annual trade value is SQL `SUM(trade_value_usd)`. Quantity is SQL
`SUM(quantity_tons)`; SQL null semantics preserve null when all quantities are
missing. Empty list endpoints return an empty list, and scalar aggregates return
null/zero only as explicitly described by their response schema.

## Growth and concentration

### Year-over-year growth

`(current - previous) / previous`.

- missing current or previous: null;
- previous zero: null;
- current zero with positive previous: `-1`;
- finite numeric inputs never return infinity or NaN.

Example: 120 after 100 is `0.20`.

### CAGR

`(end / start) ** (1 / periods) - 1`.

Start must be positive, end nonnegative, and periods positive. Missing inputs,
one observation, or invalid bounds return null. Example: 100 to 121 over two
periods is `0.10`.

### Supplier shares, count and HHI

The population is positive-value suppliers within the same active dataset and
the requested importer/product/year or explicit filter window. A supplier share
is supplier value divided by that population total. Shares sum to approximately
1 before display rounding. Supplier count uses that same positive population.

`HHI = Σ share²`, with an inclusive range of 0–1. One supplier gives 1; two equal
suppliers give 0.5; four equal suppliers give 0.25. Zero-value suppliers are
excluded. Internal calculations use unrounded values; API shares are rounded to
six decimal places for display.

Forecast features specifically calculate supplier share and HHI by
importer/HS2/year. Global product growth is calculated separately by HS2/year,
once per year rather than once per exporter row.

Volatility is population standard deviation divided by the arithmetic mean for
at least two nonnegative observations. Insufficient observations or a zero mean
produce 0 plus an explicit insufficient-data flag where used in exposure.

## Trade Supply Exposure Score

The score is deterministic and bounded to 0–100:

| Component | Weight | Component normalization |
|---|---:|---|
| Supplier concentration | 35% | `clamp(HHI, 0, 1) × 100` |
| Trade-value volatility | 25% | `clamp(coefficient of variation, 0, 1) × 100` |
| Negative recent trend | 20% | `clamp(-latest YoY growth, 0, 1) × 100` |
| Low supplier count | 10% | `min(1 / max(count, 1), 1) × 100` |
| Quantity instability | 10% | available-quantity coefficient of variation, capped at 1, × 100 |

The weights total 100%. The final formula is the sum of component percentage
times its decimal weight. Components are not rounded until serialization.

Fewer than two annual trade values sets `insufficient_history=true`; unavailable
trend and volatility contribute zero and their explanation states why. Fewer
than two non-null annual quantities sets `quantity_data_available=false`;
quantity instability contributes zero rather than maximum risk. The country
profile UI displays these limitations.

Golden example: HHI 0.5, values `[100,80]`, two suppliers and no quantity gives
components 50, 11.11, 20, 50 and 0; final score is 29.28.

## Anomalies

Rules operate on annual aggregates:

- robust year-over-year z-score at absolute score 2 or greater;
- rolling deviation of 30% or greater from up to three preceding years;
- supplier count falling from the preceding year;
- quantity or average unit-value change of 50% or greater.

Missing quantity/unit value is skipped, not converted into a change from zero.
Rule score is capped at 10: normal below 2, watch from 2, high anomaly from 3.5.
Isolation Forest uses a fixed seed and supplements rather than replaces the
explainable rules.

## Forecasts and recommendations

Forecast target is `log1p(next_year_trade_value_usd)` for
importer/exporter/HS2/year. Features are lagged before target alignment and
splits are chronological. Previous-year and three-year moving average are
baselines. A candidate activates only after its validation MAE beats the
baseline.

Only an active model for the active dataset and feature schema `forecast-v1`
may serve. Activation requires candidate status, ready dataset, candidate and
baseline metrics, an existing artifact and matching SHA-256 checksum. Rejected
or candidate models never serve. Missing/corrupt active artifacts return HTTP
503; a lane with no history returns HTTP 422. Otherwise an incompatible active
model is ignored and the transparent baseline is used.

Supplier recommendations are not trained ML. Eligible exporters must differ
from the importer, have positive recent exports and at least three observations.
The 0–100 score weights are capacity 30%, growth 20%, stability 15%, estimated
unit value 10%, existing relationship 10%, and diversification 15%. Component
values are clamped to 0–1 before weighting; weights total 100%.

## Dataset lifecycle and concurrency

Allowed transitions are:

```text
discovered -> downloading -> downloaded -> validating -> processing -> ready
discovered -------------------------------> validating
downloading/downloaded/validating/processing -> failed
failed -> validating
ready -> archived
```

Archived has no implicit exit. Restoration must be an explicit future workflow.
Failed can retry only through validation; failed-to-ready and
archived-to-processing are invalid. Transition operations lock the database row,
so stale Python objects cannot bypass the current persisted state.

Activation is atomic and locks the candidate and competing active rows. It
requires ready status, checksum, positive row count, matching database row count
and existing storage directory. It deactivates exactly the previous
source/classification version, retains it ready for rollback, records a system
audit event, and clears caches after commit. Database constraints enforce at
most one active dataset per source/classification.

Imports are idempotent. A ready version returns without reprocessing and records
an `already_ready` successful run. Streaming checkpoints completed years after
each successful year. Retried data is value-compared before insert. A transition
to validating is the database-backed import claim; a concurrent claimant sees
validating/processing and cannot start another import. Failures retain the
exception and checkpoint in the ingestion run.

## Model lifecycle, ownership and freshness

Database constraints permit one active model per task. Activation locks task
models, validates the candidate, then archives the prior active model in the same
transaction. Shared artifacts are immutable and checksum verified at activation
and inference; forecast requests do not mutate model state.

Saved analyses always filter by authenticated owner. Access by another user is
404 to avoid disclosing existence. Creation assigns the authenticated owner
server-side; clients cannot choose it.

Every analytical response identifies the active dataset version and source
period end in its metadata. Forecast and recommendation responses carry
`dataset_version` and `data_freshness`. Timestamps are timezone-aware ISO 8601.

## API status contract

- 400: invalid syntax or filter combination (`VALIDATION_ERROR`);
- 401: authentication required;
- 403: authenticated but insufficient role;
- 404: resource absent or not owned;
- 409: conflicting lifecycle/import claim when exposed through an API;
- 422: valid analytical request with insufficient history;
- 429: throttle exceeded;
- 503: required model artifact/dependency unavailable.

Errors use `{error: {code, message, details}}`. Catalog and saved-analysis lists
use standard pagination metadata. Trade/analytics responses use `data` and
`meta`; ML endpoints retain their documented flat result schema for backward
compatibility.
