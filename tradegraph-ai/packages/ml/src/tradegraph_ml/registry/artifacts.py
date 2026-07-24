import hashlib
from pathlib import Path
from typing import Any

import joblib


def artifact_checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_artifact(model: Any, path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    return artifact_checksum(path)


def load_artifact(path: Path) -> Any:
    return joblib.load(path)
