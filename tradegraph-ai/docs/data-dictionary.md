# Data dictionary

## AnnualTradeFlow

| Field | Meaning |
|---|---|
| dataset_version | Immutable source-version reference |
| year | Calendar year |
| classification | Product classification, MVP HS92 |
| hs6_code / hs4_code / hs2_code | String codes; leading zeros preserved |
| exporter / importer | Country foreign keys |
| trade_value_usd | BACI `v` multiplied by 1,000 |
| quantity_tons | Metric tons; null remains null |
| unit_value_usd_per_ton | Value divided by positive quantity, otherwise null |
| source | Provenance source |

The unique key is dataset, year, exporter, importer and HS6. Dataset metadata
stores checksum, row count, coverage, paths, synthetic status and checkpoints.

Analytics use decimal ratios in the 0–1 range for shares and HHI. API growth and
CAGR are ratios unless a field explicitly says `percent`.
