from django.core.management.base import BaseCommand

from forecasting.services import train_forecast_models


class Command(BaseCommand):
    help = "Train and evaluate Ridge and HistGradientBoosting forecast models."

    def handle(self, *args: object, **options: object) -> None:
        model = train_forecast_models()
        self.stdout.write(self.style.SUCCESS(f"{model} -> {model.status}"))
