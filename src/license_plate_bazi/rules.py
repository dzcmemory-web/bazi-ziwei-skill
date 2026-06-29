"""Rule loading for license plate scoring."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SUPPORTED_LETTERS = tuple("ABCDEFGHJKLMNPQRSTUVWXYZ")


class RuleConfigError(ValueError):
    """Raised when the rule file is missing required scoring fields."""


def default_rules_path() -> Path:
    return Path(__file__).resolve().parents[2] / "config" / "license_plate_rules.json"


def load_rules(path: str | Path | None = None) -> dict[str, Any]:
    rules_path = Path(path) if path else default_rules_path()
    with rules_path.open("r", encoding="utf-8") as f:
        rules = json.load(f)
    validate_rules(rules, rules_path)
    return rules


def validate_rules(rules: dict[str, Any], source: str | Path = "<memory>") -> None:
    required_paths = [
        ("score_weights", "bazi_match"),
        ("score_weights", "digit_luck"),
        ("score_weights", "letter_match"),
        ("score_weights", "aesthetic_memory"),
        ("score_weights", "homophone_safety"),
        ("digit_five_elements",),
        ("letter_five_elements",),
        ("element_match_points", "favorable"),
        ("element_match_points", "missing"),
        ("element_match_points", "neutral"),
        ("element_match_points", "unfavorable"),
        ("digit_luck", "base"),
        ("digit_luck", "digit_scores"),
        ("digit_luck", "patterns"),
        ("aesthetic_memory", "base"),
        ("bad_homophones",),
        ("recommendation_levels",),
        ("explain_templates", "disclaimer"),
    ]
    for path in required_paths:
        _require_path(rules, path, source)

    digit_map = rules["digit_five_elements"]
    missing_digits = [str(i) for i in range(10) if str(i) not in digit_map]
    if missing_digits:
        raise RuleConfigError(
            f"规则配置 {source} 缺少数字五行映射：{', '.join(missing_digits)}。"
        )
    digit_scores = rules["digit_luck"]["digit_scores"]
    missing_digit_scores = [str(i) for i in range(10) if str(i) not in digit_scores]
    if missing_digit_scores:
        raise RuleConfigError(
            f"规则配置 {source} 缺少数字民俗分：{', '.join(missing_digit_scores)}。"
        )

    letter_map = rules["letter_five_elements"]
    missing_letters = [letter for letter in SUPPORTED_LETTERS if letter not in letter_map]
    if missing_letters:
        raise RuleConfigError(
            f"规则配置 {source} 缺少字母五行映射：{', '.join(missing_letters)}。"
        )

    required_patterns = [
        "double",
        "triple",
        "four_or_more",
        "ascending_sequence",
        "descending_sequence",
        "palindrome",
        "contains_168",
        "contains_668",
        "contains_888",
        "contains_520",
    ]
    for key in required_patterns:
        _require_path(rules, ("digit_luck", "patterns", key), source)

    required_aesthetic = [
        "base",
        "repeated_char",
        "repeated_pair",
        "alternating_letter_digit",
        "has_letter_and_digit",
        "palindrome",
        "province_prefix_match",
        "province_prefix_mismatch",
    ]
    for key in required_aesthetic:
        _require_path(rules, ("aesthetic_memory", key), source)

    score_weights = rules["score_weights"]
    total_weight = sum(float(score_weights[key]) for key in score_weights)
    if round(total_weight, 6) != 100:
        raise RuleConfigError(f"规则配置 {source} 的 score_weights 总和必须等于 100。")

    levels = rules["recommendation_levels"]
    if not isinstance(levels, list) or not levels:
        raise RuleConfigError(f"规则配置 {source} 的 recommendation_levels 必须是非空列表。")
    for item in levels:
        if "min_score" not in item or "level" not in item:
            raise RuleConfigError(
                f"规则配置 {source} 的 recommendation_levels 每项都需要 min_score 和 level。"
            )


def _require_path(rules: dict[str, Any], path: tuple[str, ...], source: str | Path) -> None:
    current: Any = rules
    for part in path:
        if not isinstance(current, dict) or part not in current:
            joined = ".".join(path)
            raise RuleConfigError(f"规则配置 {source} 缺少字段：{joined}。")
        current = current[part]
