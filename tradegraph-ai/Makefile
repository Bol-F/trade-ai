.PHONY: setup up down logs migrate test lint format import-sample import-baci validate-dataset activate-dataset build-features train-baseline train-forecast evaluate-models

setup:
	uv sync
	cd apps/frontend && npm ci
	@if [ ! -f .env ]; then cp .env.example .env; fi

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	uv run python apps/backend/manage.py migrate

import-sample:
	uv run python apps/backend/manage.py import_sample

import-baci:
	uv run python apps/backend/manage.py import_baci --file "$(FILE)" --dataset-version "$(VERSION)" $(if $(CHECKSUM),--checksum "$(CHECKSUM)",)

validate-dataset:
	uv run python apps/backend/manage.py validate_dataset --dataset-version "$(VERSION)"

activate-dataset:
	uv run python apps/backend/manage.py activate_dataset --dataset-version "$(VERSION)"

build-features:
	uv run python apps/backend/manage.py build_features

train-baseline:
	uv run python apps/backend/manage.py train_baseline

train-forecast:
	uv run python apps/backend/manage.py train_forecast

evaluate-models:
	uv run python apps/backend/manage.py evaluate_models

test:
	uv run pytest
	cd apps/frontend && npm test -- --run

lint:
	uv run ruff check .
	uv run mypy apps/backend
	cd apps/frontend && npm run lint

format:
	uv run ruff format .
	uv run ruff check --fix .
	cd apps/frontend && npm run format
