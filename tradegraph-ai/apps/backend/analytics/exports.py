from __future__ import annotations

import csv
import io
import json
from html import escape

from analytics.models import SavedAnalysis


def safe_csv_cell(value: object) -> str:
    text = str(value)
    dangerous = text.startswith(("\t", "\r")) or text.lstrip(" ").startswith(("=", "+", "-", "@"))
    return f"'{text}" if dangerous else text


def render_analysis_export(analysis: SavedAnalysis, format_name: str) -> str:
    report = {
        "analysis_title": analysis.title,
        "filters": analysis.filters,
        "generated_date": analysis.updated_at.isoformat(),
        "visualization": analysis.visualization,
        "methodology_notes": "See /methodology for metric definitions.",
        "limitations": (
            "Annual source coverage is not real-time; forecasts and anomalies are statistical."
        ),
    }
    if format_name == "json":
        return json.dumps(report, indent=2)
    if format_name == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["field", "value"])
        for key, value in report.items():
            writer.writerow(
                [
                    safe_csv_cell(key),
                    safe_csv_cell(json.dumps(value) if isinstance(value, dict) else value),
                ]
            )
        return output.getvalue()
    if format_name == "html":
        rows = "".join(
            f"<tr><th>{escape(str(key))}</th><td>{escape(str(value))}</td></tr>"
            for key, value in report.items()
        )
        return (
            "<!doctype html><html><head><meta charset='utf-8'>"
            f"<title>{escape(analysis.title)}</title>"
            "<style>body{font-family:system-ui;max-width:900px;margin:auto;padding:2rem}"
            "table{border-collapse:collapse}"
            "th,td{border:1px solid #ccc;padding:.5rem;text-align:left}"
            "@media print{nav{display:none}}</style></head><body>"
            f"<h1>{escape(analysis.title)}</h1><table>{rows}</table></body></html>"
        )
    raise ValueError("Unsupported export format.")
