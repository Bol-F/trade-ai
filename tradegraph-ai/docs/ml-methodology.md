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
