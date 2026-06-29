"""Command line interface for the license plate BaZi prototype."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .bazi_adapter import (
    BirthInfo,
    build_bazi_profile,
    normalize_gender,
    parse_birth_date,
    parse_birth_time,
)
from .explainer import render_markdown
from .plate_parser import PlateParseError
from .rules import RuleConfigError, load_rules
from .scoring import score_plates


def _default_calculator_dir() -> str:
    return str(Path(__file__).resolve().parents[2] / "calculator")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="license-plate-bazi",
        description="根据生辰八字和可配置民俗规则，对候选车牌做娱乐参考评分。",
    )
    parser.add_argument("--birth-date", required=True, help="公历出生日期，格式 YYYY-MM-DD")
    parser.add_argument("--birth-time", default="unknown", help="出生时间，格式 HH:MM；未知填 unknown")
    parser.add_argument("--gender", default="unknown", help="male/female/unknown，或 男/女/未知")
    parser.add_argument("--birth-place", default=None, help="出生地，可选；原型暂只保留在说明中")
    parser.add_argument("--plates", nargs="+", required=True, help="候选车牌，例如 粤B8A68Z 粤B52088")
    parser.add_argument("--current-prefix", default=None, help="当前省份/城市前缀，可填 粤 或 粤B")
    parser.add_argument("--rules", default=None, help="自定义评分规则 JSON 文件路径")
    parser.add_argument(
        "--calculator-dir",
        default=_default_calculator_dir(),
        help="主项目 calculator 目录；依赖可用时会优先调用完整排盘",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        birth = BirthInfo(
            birth_date=parse_birth_date(args.birth_date),
            birth_time=parse_birth_time(args.birth_time),
            gender=normalize_gender(args.gender),
            birth_place=args.birth_place,
        )
        rules = load_rules(args.rules)
        profile = build_bazi_profile(birth, calculator_dir=args.calculator_dir)
        scores = score_plates(
            args.plates,
            profile,
            current_prefix=args.current_prefix,
            rules=rules,
        )
    except (ValueError, PlateParseError, FileNotFoundError, RuleConfigError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 2

    print(render_markdown(scores, birth, profile))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
