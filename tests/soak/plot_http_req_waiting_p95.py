#!/usr/bin/env python3
"""Compute and plot p95(http_req_waiting) over time from k6 NDJSON output.

Usage:
    python tests/soak/plot_http_req_waiting_p95.py \
        --input tests/soak/soak-results.ndjson \
    --window 1m \
        --csv tests/soak/http_req_waiting_p95.csv \
        --png tests/soak/http_req_waiting_p95.png
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to k6 NDJSON output")
    parser.add_argument("--window", default="1m", help="Bucket window: 1m, 5m, 10m, 1h")
    parser.add_argument(
        "--csv",
        default="tests/soak/http_req_waiting_p95.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--png",
        default="tests/soak/http_req_waiting_p95.png",
        help="Output PNG path",
    )
    return parser.parse_args()


def window_to_seconds(window: str) -> int:
    units = {"s": 1, "m": 60, "h": 3600}
    if len(window) < 2 or window[-1] not in units:
        raise ValueError("Unsupported --window format. Examples: 1m, 5m, 1h")
    value = int(window[:-1])
    if value <= 0:
        raise ValueError("Window value must be > 0")
    return value * units[window[-1]]


def parse_time(raw: str) -> dt.datetime:
    # k6 timestamps are ISO-8601; normalize trailing Z for fromisoformat.
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    return dt.datetime.fromisoformat(raw)


def bucket_floor(ts: dt.datetime, window_seconds: int) -> dt.datetime:
    epoch = int(ts.timestamp())
    floored = epoch - (epoch % window_seconds)
    return dt.datetime.fromtimestamp(floored, tz=dt.timezone.utc)


def p95(values: List[float]) -> float:
    if not values:
        return math.nan
    sorted_values = sorted(values)
    # Nearest-rank definition of percentile
    rank = max(1, math.ceil(0.95 * len(sorted_values)))
    return sorted_values[rank - 1]


def load_waiting_points(
    input_path: Path, window_seconds: int
) -> Dict[dt.datetime, List[float]]:
    buckets: Dict[dt.datetime, List[float]] = defaultdict(list)

    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            if (
                event.get("type") != "Point"
                or event.get("metric") != "http_req_waiting"
            ):
                continue

            data = event.get("data") or {}
            raw_time = data.get("time")
            value = data.get("value")

            if raw_time is None or value is None:
                continue

            try:
                ts = parse_time(raw_time)
                numeric_value = float(value)
            except (ValueError, TypeError):
                continue

            bucket = bucket_floor(ts, window_seconds)
            buckets[bucket].append(numeric_value)

    return buckets


def build_series(
    buckets: Dict[dt.datetime, List[float]],
) -> List[Tuple[dt.datetime, float, int]]:
    series: List[Tuple[dt.datetime, float, int]] = []
    for bucket in sorted(buckets.keys()):
        values = buckets[bucket]
        series.append((bucket, p95(values), len(values)))
    return series


def format_local_timestamp(ts: dt.datetime) -> str:
    # Example: 2026-04-03  07:45 PM
    return ts.astimezone().strftime("%Y-%m-%d  %I:%M %p")


def local_timezone() -> dt.tzinfo:
    return dt.datetime.now().astimezone().tzinfo or dt.timezone.utc


def write_csv(path: Path, series: List[Tuple[dt.datetime, float, int]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["timestamp_local", "p95_http_req_waiting_ms", "sample_count"])
        for ts, p95_ms, count in series:
            writer.writerow([format_local_timestamp(ts), f"{p95_ms:.3f}", count])


def try_plot(path: Path, series: List[Tuple[dt.datetime, float, int]]) -> bool:
    try:
        import matplotlib.pyplot as plt  # type: ignore
        import matplotlib.dates as mdates  # type: ignore
    except Exception:
        return False

    tz_local = local_timezone()
    times = [item[0].astimezone(tz_local) for item in series]
    p95_values = [item[1] for item in series]

    plt.figure(figsize=(12, 5))
    plt.plot(times, p95_values, linewidth=1.4)
    plt.title("k6 Soak: p95(http_req_waiting) over time")
    plt.xlabel("Time (local)")
    plt.ylabel("p95 waiting (ms)")
    plt.gca().xaxis.set_major_formatter(
        mdates.DateFormatter("%Y-%m-%d  %I:%M %p", tz=tz_local)
    )
    plt.gcf().autofmt_xdate()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path, dpi=150)
    plt.close()
    return True


def main() -> None:
    args = parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    window_seconds = window_to_seconds(args.window)
    buckets = load_waiting_points(input_path, window_seconds)
    series = build_series(buckets)

    if not series:
        raise RuntimeError("No http_req_waiting points were found in the NDJSON file")

    csv_path = Path(args.csv)
    write_csv(csv_path, series)

    png_path = Path(args.png)
    plotted = try_plot(png_path, series)

    print(f"Wrote CSV: {csv_path}")
    if plotted:
        print(f"Wrote PNG: {png_path}")
    else:
        print("matplotlib not found: PNG plot not generated")
        print("Install with: pip install matplotlib")


if __name__ == "__main__":
    main()
