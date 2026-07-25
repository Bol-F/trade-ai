# Trade forecast model card

- Version: forecast-v2
- Purpose: estimate the next annual bilateral HS2 trade value for scenario exploration.
- Algorithm: production-selected Ridge or HistGradientBoostingRegressor; three-year average fallback.
- Target: next-calendar-year `log1p(trade_value_usd)`.
- Features: prior annual values and quantity, lagged growth, three-year level/volatility, supplier share/count, HHI, global HS2 growth, year and categorical lane identifiers.
- Training data: the explicitly recorded promoted dataset version. Feature rows are exact calendar-year joins, so missing years do not silently become adjacent lags.
- Validation: chronological validation and held-out test years, with expanding-window evaluation support.
- Metrics: MAE, RMSE, sMAPE, median absolute error and value-weighted absolute error globally and by HS2, importer, exporter, value size, history length and flow type.
- Known limitations: cannot know wars, sanctions, policy changes, reporting revisions, classification breaks or future supply shocks. Sparse and zero-heavy flows are difficult to model.
- Ethical and misuse considerations: decision support only. Do not use forecasts to deny services, infer illicit activity, or represent statistical anomalies as fraud.
- Supported use: exploratory annual trade planning where source history and model lineage are visible.
- Unsupported use: guaranteed financial projections, causal claims, real-time predictions or high-confidence use outside the training distribution.

The approximate 95% interval uses held-out residual RMSE with a normal approximation. It communicates uncertainty but is not a guarantee, especially after structural breaks.
