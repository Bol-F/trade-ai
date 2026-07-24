from __future__ import annotations

import re
import subprocess
from pathlib import Path

PATTERNS = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bsk-[A-Za-z0-9]{32,}\b"),
    re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    re.compile(r"^UN_COMTRADE_API_KEY\s*=\s*[A-Za-z0-9_-]{16,}", re.MULTILINE),
]
ALLOWED = {".env.example"}


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    tracked = subprocess.check_output(
        ["git", "ls-files", "tradegraph-ai"], cwd=root.parent, text=True
    ).splitlines()
    findings: list[str] = []
    for relative in tracked:
        path = root.parent / relative
        if path.name in ALLOWED or not path.is_file():
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pattern in PATTERNS:
            if pattern.search(content):
                findings.append(f"{relative}: matched {pattern.pattern}")
    if findings:
        print("\n".join(findings))
        return 1
    print(f"Secret scan passed for {len(tracked)} tracked files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
