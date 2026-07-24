from __future__ import annotations

import math
import statistics
from collections.abc import Sequence
from dataclasses import dataclass
from typing import cast


def growth(current: float, previous: float | None) -> float | None:
    if previous is None or previous == 0:
        return None
    return (current - previous) / previous


def cagr(start: float | None, end: float | None, periods: int) -> float | None:
    if start is None or end is None or start <= 0 or end < 0 or periods <= 0:
        return None
    return cast(float, (end / start) ** (1 / periods) - 1)


def hhi(values: Sequence[float]) -> float:
    total = sum(value for value in values if value > 0)
    if total <= 0:
        return 0.0
    return sum((value / total) ** 2 for value in values if value > 0)


def coefficient_of_variation(values: Sequence[float]) -> float:
    positive = [value for value in values if value >= 0]
    if len(positive) < 2:
        return 0.0
    mean = statistics.fmean(positive)
    return statistics.pstdev(positive) / mean if mean else 0.0


def robust_z_scores(values: Sequence[float]) -> list[float]:
    if not values:
        return []
    median = statistics.median(values)
    deviations = [abs(value - median) for value in values]
    mad = statistics.median(deviations)
    if mad == 0:
        return [0.0 for _ in values]
    return [0.6745 * (value - median) / mad for value in values]


@dataclass(frozen=True)
class ExposureComponents:
    supplier_concentration: float
    trade_value_volatility: float
    negative_recent_trend: float
    low_supplier_count: float
    quantity_instability: float

    @property
    def score(self) -> float:
        return round(
            self.supplier_concentration * 35
            + self.trade_value_volatility * 25
            + self.negative_recent_trend * 20
            + self.low_supplier_count * 10
            + self.quantity_instability * 10,
            2,
        )

    def as_dict(self) -> dict[str, float]:
        return {
            "supplier_concentration": round(self.supplier_concentration, 4),
            "trade_value_volatility": round(self.trade_value_volatility, 4),
            "negative_recent_trend": round(self.negative_recent_trend, 4),
            "low_supplier_count": round(self.low_supplier_count, 4),
            "quantity_instability": round(self.quantity_instability, 4),
        }


def exposure_components(
    concentration: float,
    yearly_values: Sequence[float],
    supplier_count: int,
    yearly_quantities: Sequence[float],
) -> ExposureComponents:
    recent_growth = (
        growth(yearly_values[-1], yearly_values[-2]) if len(yearly_values) >= 2 else None
    )
    return ExposureComponents(
        supplier_concentration=min(max(concentration, 0), 1),
        trade_value_volatility=min(coefficient_of_variation(yearly_values), 1),
        negative_recent_trend=min(max(-(recent_growth or 0), 0), 1),
        low_supplier_count=1 / max(supplier_count, 1),
        quantity_instability=min(coefficient_of_variation(yearly_quantities), 1),
    )


def finite(value: float) -> float:
    return value if math.isfinite(value) else 0.0
