from __future__ import annotations

import math
import statistics
from collections.abc import Sequence
from dataclasses import dataclass
from typing import cast


def growth(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None or previous == 0:
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
    """Exposure components are normalized percentages in the inclusive 0-100 range."""

    supplier_concentration: float
    trade_value_volatility: float
    negative_recent_trend: float
    low_supplier_count: float
    quantity_instability: float
    insufficient_history: bool
    quantity_data_available: bool

    @property
    def score(self) -> float:
        return round(
            self.supplier_concentration * 0.35
            + self.trade_value_volatility * 0.25
            + self.negative_recent_trend * 0.20
            + self.low_supplier_count * 0.10
            + self.quantity_instability * 0.10,
            2,
        )

    def as_dict(self) -> dict[str, float]:
        return {
            "supplier_concentration": round(self.supplier_concentration, 2),
            "trade_value_volatility": round(self.trade_value_volatility, 2),
            "negative_recent_trend": round(self.negative_recent_trend, 2),
            "low_supplier_count": round(self.low_supplier_count, 2),
            "quantity_instability": round(self.quantity_instability, 2),
        }

    def explanations(self) -> dict[str, str]:
        return {
            "supplier_concentration": "HHI normalized from 0-1 to 0-100.",
            "trade_value_volatility": (
                "Coefficient of variation capped at 1 and normalized to 0-100."
                if not self.insufficient_history
                else "Unavailable: at least two annual trade values are required."
            ),
            "negative_recent_trend": (
                "Magnitude of the latest negative year-over-year change, capped at 100."
                if not self.insufficient_history
                else "Unavailable: at least two annual trade values are required."
            ),
            "low_supplier_count": "Inverse supplier count normalized to 0-100.",
            "quantity_instability": (
                "Coefficient of variation for available quantities, capped at 100."
                if self.quantity_data_available
                else "Unavailable: at least two non-null annual quantities are required."
            ),
        }


def exposure_components(
    concentration: float,
    yearly_values: Sequence[float],
    supplier_count: int,
    yearly_quantities: Sequence[float | None],
) -> ExposureComponents:
    insufficient_history = len(yearly_values) < 2
    recent_growth = (
        growth(yearly_values[-1], yearly_values[-2]) if len(yearly_values) >= 2 else None
    )
    available_quantities = [value for value in yearly_quantities if value is not None]
    return ExposureComponents(
        supplier_concentration=min(max(concentration, 0), 1) * 100,
        trade_value_volatility=(
            min(coefficient_of_variation(yearly_values), 1) * 100 if not insufficient_history else 0
        ),
        negative_recent_trend=(
            min(max(-(recent_growth or 0), 0), 1) * 100 if not insufficient_history else 0
        ),
        low_supplier_count=min(1 / max(supplier_count, 1), 1) * 100,
        quantity_instability=(
            min(coefficient_of_variation(available_quantities), 1) * 100
            if len(available_quantities) >= 2
            else 0
        ),
        insufficient_history=insufficient_history,
        quantity_data_available=len(available_quantities) >= 2,
    )


def finite(value: float) -> float:
    return value if math.isfinite(value) else 0.0
