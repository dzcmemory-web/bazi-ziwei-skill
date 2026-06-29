#!/usr/bin/env python3
"""Thin wrapper for running the local prototype without installing it."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from license_plate_bazi.cli import main


if __name__ == "__main__":
    raise SystemExit(main())
