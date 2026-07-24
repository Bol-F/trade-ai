import json
from pathlib import Path

import numpy as np
from django.conf import settings
from django.core.management.base import BaseCommand
from tradegraph_ml.evaluation.metrics import grouped_evaluation
from tradegraph_ml.forecasting import moving_average_forecast

from forecasting.services import build_feature_frame


class Command(BaseCommand):
    help = "Evaluate the three-year moving-average forecast baseline."

    def handle(self, *args: object, **options: object) -> None:
        frame = build_feature_frame().fill_null(0)
        actual = np.expm1(frame["target"].to_numpy())
        predicted = moving_average_forecast(
            frame.select(["trade_value_lag_1", "trade_value_lag_2", "trade_value_lag_3"]).to_numpy()
        )
        report = grouped_evaluation(frame, actual, predicted)
        path = (
            Path(settings.BASE_DIR).parent.parent / "artifacts" / "ml" / "baseline-evaluation.json"
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(str(path)))
