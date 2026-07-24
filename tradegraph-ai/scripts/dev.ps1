[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet(
        "setup", "up", "down", "logs", "migrate", "test", "lint", "format",
        "import-sample", "import-baci", "validate-dataset", "activate-dataset",
        "build-features", "train-baseline", "train-forecast", "evaluate-models"
    )]
    [string]$Command = "setup",
    [string]$File,
    [string]$Version,
    [string]$Checksum
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

function Invoke-Checked {
    param(
        [Parameter(Mandatory)]
        [string]$Program,
        [Parameter(ValueFromRemainingArguments)]
        [string[]]$Arguments
    )

    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program exited with code $LASTEXITCODE"
    }
}

switch ($Command) {
    "setup" {
        Invoke-Checked uv sync
        Invoke-Checked npm --prefix apps/frontend ci
        if (-not (Test-Path -LiteralPath ".env")) {
            Copy-Item -LiteralPath ".env.example" -Destination ".env"
        }
    }
    "up" { Invoke-Checked docker compose up --build -d }
    "down" { Invoke-Checked docker compose down }
    "logs" { Invoke-Checked docker compose logs -f }
    "migrate" { Invoke-Checked uv run python apps/backend/manage.py migrate }
    "test" {
        Invoke-Checked uv run pytest
        Invoke-Checked npm test
    }
    "lint" {
        Invoke-Checked uv run ruff check .
        Invoke-Checked uv run mypy .
        Invoke-Checked npm run lint
    }
    "format" {
        Invoke-Checked uv run ruff format .
        Invoke-Checked uv run ruff check --fix .
        Invoke-Checked npm run format
    }
    "import-sample" { Invoke-Checked uv run python apps/backend/manage.py import_sample }
    "import-baci" {
        if (-not $File -or -not $Version) {
            throw "import-baci requires -File and -Version."
        }
        $arguments = @(
            "run", "python", "apps/backend/manage.py", "import_baci",
            "--file", $File, "--dataset-version", $Version
        )
        if ($Checksum) {
            $arguments += @("--checksum", $Checksum)
        }
        Invoke-Checked uv @arguments
    }
    "validate-dataset" {
        if (-not $Version) {
            throw "validate-dataset requires -Version."
        }
        Invoke-Checked uv run python apps/backend/manage.py validate_dataset --dataset-version $Version
    }
    "activate-dataset" {
        if (-not $Version) {
            throw "activate-dataset requires -Version."
        }
        Invoke-Checked uv run python apps/backend/manage.py activate_dataset --dataset-version $Version
    }
    "build-features" { Invoke-Checked uv run python apps/backend/manage.py build_features }
    "train-baseline" { Invoke-Checked uv run python apps/backend/manage.py train_baseline }
    "train-forecast" { Invoke-Checked uv run python apps/backend/manage.py train_forecast }
    "evaluate-models" { Invoke-Checked uv run python apps/backend/manage.py evaluate_models }
}
