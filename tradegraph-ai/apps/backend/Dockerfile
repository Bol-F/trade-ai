FROM ghcr.io/astral-sh/uv:0.8-python3.12-bookworm-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY packages/data_pipeline /app/packages/data_pipeline
COPY packages/ml /app/packages/ml
RUN uv sync --frozen --no-dev

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY apps/backend /app/apps/backend
COPY packages/data_pipeline /app/packages/data_pipeline
COPY packages/ml /app/packages/ml
COPY data/sample /app/data/sample
ENV PYTHONPATH="/app/packages/data_pipeline/src:/app/packages/ml/src"
WORKDIR /app/apps/backend
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
