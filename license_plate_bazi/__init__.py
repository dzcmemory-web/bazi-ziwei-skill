"""Repo-root import shim for `python -m license_plate_bazi.cli`.

The actual package lives under src/license_plate_bazi. This shim keeps the
module CLI usable from a fresh checkout without requiring editable install.
"""

from pathlib import Path

_SRC_PACKAGE = Path(__file__).resolve().parents[1] / "src" / "license_plate_bazi"
__path__ = [str(_SRC_PACKAGE)]

_SRC_INIT = _SRC_PACKAGE / "__init__.py"
exec(compile(_SRC_INIT.read_text(encoding="utf-8"), str(_SRC_INIT), "exec"))
