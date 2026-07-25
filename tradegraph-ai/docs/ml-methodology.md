# ML methodology

Forecast target is `log1p(next_year_trade_value_usd)` at importer/exporter/HS2/year.
Features are lagged before target alignment. Splits are chronological: training,
validation, then untouched test. Random train/test splitting is prohibited.

Baselines are previous-year value and three-year moving average. Candidates are
Ridge and HistGradientBoosting. Reports include MAE, RMSE, sMAPE and median
absolute error globally and by HS2, importer and value-size group. Activation uses
validation MAE; held-out test metrics are reported but never used for selection.
Poor candidates are rejected and retained.

Isolation Forest uses growth, rolling deviation, quantity and unit-value growth,
supplier-share change and product growth. It supplements—not replaces—the
transparent anomaly rules. Evaluation includes deterministic training and
synthetic anomaly injection.

Supplier Finder is a transparent weighted ranking, not a trained ML model.
Forecasts and exposure scores are decision-support indicators, not guarantees or
complete economic/security risk assessments.

Supplier share, supplier count and HHI features use the importer/HS2/year
population and exclude zero-value suppliers. Global product growth uses the
separate HS2/year total. Missing quantities remain null until model matrix
preparation and do not become observed zero trade quantities.

The normative formulas, null behavior, lifecycle requirements and golden
examples are documented in [business rules](business-rules.md).
# Data lineage

Every forecast response carries a lineage object with the source code, promoted dataset
version, feature-dataset version, feature-schema version, model version, training period,
and UTC inference timestamp. Model artifacts are checksum verified. The retained
evaluation JSON and model card complete the trace from source data to an inference.

Feature schema `forecast-v2` uses exact calendar-year joins for lags. A missing year is
therefore missing data, not a disguised one-year lag. Training stops when validation
finds duplicate keys, wrong ordering or types, missing required columns or targets,
infinite values, invalid ISO3/HS2 identifiers, negative unit inputs, or mixed dataset
versions.

# Activation and rollback policy

A candidate may be activated only through an explicit administrative/service action
after feature validation passes, a checksum and evaluation report exist, the candidate
beats the moving-average baseline, important segment reports are present, and artifact
compatibility/reproducibility checks pass. Complexity alone is never an activation
reason. Activation and rollback create immutable audit events. Rollback selects the most
recent archived compatible model. Drift creates a review signal and never automatically
re-trains or activates a model.

# Reliability warnings and uncertainty

Inference falls back to the three-year average for insufficient history, stale data,
large structural-break signals, incompatible feature schemas, or missing approved
models. An approximate 95% prediction interval is based on held-out residual RMSE and
a normal approximation. It is statistically interpretable under stable residuals but
is not guaranteed and may under-cover after structural breaks.

# Anomalies and supplier ranking

Rule-based and Isolation Forest signals remain separate. Synthetic evaluation covers
value increases/decreases, supplier disappearance, quantity collapse, unit-value spikes,
and supplier-share shifts. These are statistical or ML anomalies—not confirmed real-world
issues and never fraud labels.

Supplier components use documented weights (30/20/15/15/10/10), bounded normalization,
neutral treatment for missing unit value, percentile clipping against outliers,
deterministic tie-breaking, minimum-history filters, and ±10% weight sensitivity checks.
