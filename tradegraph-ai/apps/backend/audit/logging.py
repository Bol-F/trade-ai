import logging


class StructuredDefaultsFilter(logging.Filter):
    fields = (
        "request_id",
        "user_id",
        "endpoint",
        "duration",
        "status_code",
        "task_id",
        "dataset_version",
        "model_version",
    )

    def filter(self, record: logging.LogRecord) -> bool:
        for field in self.fields:
            if not hasattr(record, field):
                setattr(record, field, None)
        return True
