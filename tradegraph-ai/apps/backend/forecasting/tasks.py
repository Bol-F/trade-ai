from celery import shared_task

from forecasting.services import train_forecast_models


@shared_task  # type: ignore[untyped-decorator]
def train_forecast_models_task() -> str:
    return str(train_forecast_models().pk)
