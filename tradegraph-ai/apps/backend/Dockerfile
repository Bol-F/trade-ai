FROM ghcr.io/astral-sh/uv:0.8-python3.12-bookworm-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY apps/backend /app/apps/backend
WORKDIR /app/apps/backend
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
