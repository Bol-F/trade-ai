.PHONY: setup up down logs migrate test lint format

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
