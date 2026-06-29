"""Deterministic, explainable license plate scoring."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any, Iterable

from .bazi_adapter import BaziProfile
from .plate_parser import LicensePlate, PlateParseError, parse_plates
from .rules import load_rules, validate_rules


@dataclass(frozen=True)
class ScoreBreakdown:
    bazi_match: float
    digit_luck: float
    letter_match: float
    aesthetic_memory: float
    homophone_safety: float

    @property
    def total(self) -> float:
        return round(
            self.bazi_match
            + self.digit_luck
            + self.letter_match
            + self.aesthetic_memory
            + self.homophone_safety,
            2,
        )


@dataclass(frozen=True)
class PlateScore:
    plate: LicensePlate
    score: float
    level: str
    breakdown: ScoreBreakdown
    reasons: tuple[str, ...]
    conflicts: tuple[str, ...]


def score_plates(
    plate_values: Iterable[str | LicensePlate],
    profile: BaziProfile,
    current_prefix: str | None = None,
    rules: dict[str, Any] | None = None,
) -> list[PlateScore]:
    rules = rules or load_rules()
    validate_rules(rules)
    values = list(plate_values)
    if not values:
        raise PlateParseError("候选车牌不能为空，请至少提供一个车牌。")

    plates = [
        value if isinstance(value, LicensePlate) else parse_plates([value])[0]
        for value in values
    ]
    scored = [score_plate(plate, profile, current_prefix=current_prefix, rules=rules) for plate in plates]
    return sorted(scored, key=lambda item: (-item.score, item.plate.normalized))


def score_plate(
    plate: LicensePlate,
    profile: BaziProfile,
    current_prefix: str | None = None,
    rules: dict[str, Any] | None = None,
) -> PlateScore:
    rules = rules or load_rules()
    validate_rules(rules)
    weights = rules["score_weights"]
    all_elements, all_element_labels = _serial_elements(plate, rules)
    digit_elements, digit_labels = _digit_elements(plate, rules)
    letter_elements, letter_labels = _letter_elements(plate, rules)

    bazi_match, bazi_reason = _element_match_component(
        all_elements,
        profile,
        weights["bazi_match"],
        rules,
        "八字喜用神匹配",
    )
    digit_luck, digit_reasons = _digit_luck_component(plate, digit_labels, weights["digit_luck"], rules)
    letter_match, letter_reason = _element_match_component(
        letter_elements,
        profile,
        weights["letter_match"],
        rules,
        "字母五行匹配",
    )
    aesthetic, aesthetic_reasons = _aesthetic_component(
        plate, current_prefix, weights["aesthetic_memory"], rules
    )
    homophone, homophone_reasons, conflicts = _homophone_component(
        plate, weights["homophone_safety"], rules
    )

    conflicts = [
        *conflicts,
        *_unfavorable_element_conflicts(all_element_labels, profile.unfavorable_elements),
    ]
    breakdown = ScoreBreakdown(
        bazi_match=bazi_match,
        digit_luck=digit_luck,
        letter_match=letter_match,
        aesthetic_memory=aesthetic,
        homophone_safety=homophone,
    )
    score = round(max(0, min(100, breakdown.total)), 2)
    reasons = (
        f"八字五行偏好：喜用参考为{'、'.join(profile.favorable_elements) or '无'}；"
        f"避重参考为{'、'.join(profile.unfavorable_elements) or '无'}。",
        f"数字五行：{', '.join(digit_labels)}。",
        f"字母五行：{', '.join(letter_labels) if letter_labels else '无后缀字母'}。",
        bazi_reason,
        *digit_reasons,
        letter_reason,
        *aesthetic_reasons,
        *homophone_reasons,
    )
    return PlateScore(
        plate=plate,
        score=score,
        level=recommendation_level(score, rules),
        breakdown=breakdown,
        reasons=tuple(reason for reason in reasons if reason),
        conflicts=tuple(dict.fromkeys(conflicts)),
    )


def _serial_elements(plate: LicensePlate, rules: dict[str, Any]) -> tuple[list[str], list[str]]:
    digit_map = rules["digit_five_elements"]
    letter_map = rules["letter_five_elements"]
    elements: list[str] = []
    labels: list[str] = []
    for ch in plate.serial:
        if ch.isdigit():
            element = digit_map[ch]
        else:
            element = letter_map[ch]
        elements.append(element)
        labels.append(f"{ch}={element}")
    return elements, labels


def _digit_elements(plate: LicensePlate, rules: dict[str, Any]) -> tuple[list[str], list[str]]:
    digit_map = rules["digit_five_elements"]
    return [digit_map[ch] for ch in plate.digits], [f"{ch}={digit_map[ch]}" for ch in plate.digits]


def _letter_elements(plate: LicensePlate, rules: dict[str, Any]) -> tuple[list[str], list[str]]:
    letter_map = rules["letter_five_elements"]
    return [letter_map[ch] for ch in plate.letters], [f"{ch}={letter_map[ch]}" for ch in plate.letters]


def _element_match_component(
    elements: list[str],
    profile: BaziProfile,
    max_score: float,
    rules: dict[str, Any],
    label: str,
) -> tuple[float, str]:
    if not elements:
        return round(max_score * 0.4, 2), f"{label}：没有可评分字符，按保守分处理。"

    points = rules["element_match_points"]
    raw = 0.0
    detail: list[str] = []
    favorite = set(profile.favorable_elements)
    missing = set(profile.missing_elements)
    unfavorable = set(profile.unfavorable_elements)
    for element in elements:
        if element in favorite:
            raw += points["favorable"]
            detail.append(f"{element}+喜用")
        elif element in missing:
            raw += points["missing"]
            detail.append(f"{element}+补缺")
        elif element in unfavorable:
            raw += points["unfavorable"]
            detail.append(f"{element}-避重")
        else:
            raw += points["neutral"]
            detail.append(f"{element}中性")

    best = points["favorable"] * len(elements)
    worst = points["unfavorable"] * len(elements)
    score = (raw - worst) / (best - worst) * max_score
    return round(_clamp(score, 0, max_score), 2), f"{label}：{'; '.join(detail)}。"


def _digit_luck_component(
    plate: LicensePlate,
    digit_labels: list[str],
    max_score: float,
    rules: dict[str, Any],
) -> tuple[float, tuple[str, ...]]:
    config = rules["digit_luck"]
    digit_scores = config["digit_scores"]
    score = float(config["base"])
    digit_score_total = sum(float(digit_scores[d]) for d in plate.digits)
    score += digit_score_total
    reasons = [f"数字组合基础：{''.join(plate.digits)}，单数字民俗分合计 {digit_score_total:+.1f}。"]

    digit_string = "".join(plate.digits)
    pattern_bonus, pattern_reasons = _digit_pattern_bonus(digit_string, config["patterns"])
    score += pattern_bonus
    reasons.extend(pattern_reasons)
    score = _clamp(score, 0, max_score)
    reasons.append(f"数字五行明细：{', '.join(digit_labels)}。")
    return round(score, 2), tuple(reasons)


def _digit_pattern_bonus(digits: str, patterns: dict[str, float]) -> tuple[float, list[str]]:
    bonus = 0.0
    reasons: list[str] = []
    longest = _longest_run(digits)
    if longest >= 4:
        bonus += patterns["four_or_more"]
        reasons.append("包含四连或更多重复号，易记性强。")
    elif longest == 3:
        bonus += patterns["triple"]
        reasons.append("包含三连号，民俗上常认为辨识度较好。")
    elif longest == 2:
        bonus += patterns["double"]
        reasons.append("包含重复号，较容易记。")

    if _has_sequence(digits, step=1):
        bonus += patterns["ascending_sequence"]
        reasons.append("包含顺子号，读起来更顺。")
    if _has_sequence(digits, step=-1):
        bonus += patterns["descending_sequence"]
        reasons.append("包含倒顺子号，辨识度较高。")
    if len(digits) >= 3 and digits == digits[::-1]:
        bonus += patterns["palindrome"]
        reasons.append("数字部分回文，对称感较好。")
    for key, reason in {
        "168": "包含 168，常被解读为顺口吉祥组合。",
        "668": "包含 668，重复 6/8 带来顺口记忆点。",
        "888": "包含 888，民俗语境里很讨喜。",
        "520": "包含 520，谐音记忆点强。",
    }.items():
        if key in digits:
            bonus += patterns[f"contains_{key}"]
            reasons.append(reason)
    return bonus, reasons


def _aesthetic_component(
    plate: LicensePlate,
    current_prefix: str | None,
    max_score: float,
    rules: dict[str, Any],
) -> tuple[float, tuple[str, ...]]:
    config = rules["aesthetic_memory"]
    score = float(config["base"])
    reasons: list[str] = []
    serial = plate.serial
    if any(count > 1 for count in Counter(serial).values()):
        score += config["repeated_char"]
        reasons.append("后缀有重复字符，视觉记忆点较明显。")
    if _has_repeated_pair(serial):
        score += config["repeated_pair"]
        reasons.append("后缀有重复字符组，整体更好记。")
    if plate.letters and plate.digits:
        score += config["has_letter_and_digit"]
        reasons.append("字母和数字都有，视觉层次较清楚。")
    if _is_alternating_letter_digit(serial):
        score += config["alternating_letter_digit"]
        reasons.append("字母数字交替，读写节奏较清晰。")
    if len(serial) >= 5 and serial == serial[::-1]:
        score += config["palindrome"]
        reasons.append("后缀整体对称感较强。")
    if current_prefix:
        prefix = current_prefix.strip().upper()
        if plate.normalized.startswith(prefix):
            score += config["province_prefix_match"]
            reasons.append(f"与当前地区前缀 {current_prefix} 匹配。")
        else:
            score += config["province_prefix_mismatch"]
            reasons.append(f"与当前地区前缀 {current_prefix} 不匹配，实际办理前需确认。")
    if not reasons:
        reasons.append("整体易记性中等，没有明显加分结构。")
    return round(_clamp(score, 0, max_score), 2), tuple(reasons)


def _homophone_component(
    plate: LicensePlate,
    max_score: float,
    rules: dict[str, Any],
) -> tuple[float, tuple[str, ...], list[str]]:
    score = float(max_score)
    reasons: list[str] = []
    conflicts: list[str] = []
    digit_string = "".join(plate.digits)
    for pattern, config in rules["bad_homophones"].items():
        if pattern in digit_string:
            penalty = float(config["penalty"])
            score -= penalty
            reason = str(config["reason"])
            reasons.append(f"避雷项：{reason}，扣 {penalty:g} 分。")
            conflicts.append(reason)
    if not reasons:
        reasons.append("未发现配置中的明显避雷谐音组合。")
    return round(_clamp(score, 0, max_score), 2), tuple(reasons), conflicts


def _unfavorable_element_conflicts(
    labels: list[str],
    unfavorable_elements: tuple[str, ...],
) -> list[str]:
    bad = set(unfavorable_elements)
    conflicts = [label for label in labels if label.split("=")[1] in bad]
    if not conflicts:
        return []
    return [f"含避重五行字符：{', '.join(conflicts)}"]


def recommendation_level(score: float, rules: dict[str, Any] | None = None) -> str:
    rules = rules or load_rules()
    validate_rules(rules)
    for item in rules["recommendation_levels"]:
        if score >= item["min_score"]:
            return item["level"]
    return "不建议"


def _longest_run(text: str) -> int:
    longest = 0
    current = 0
    previous = None
    for ch in text:
        current = current + 1 if ch == previous else 1
        previous = ch
        longest = max(longest, current)
    return longest


def _has_sequence(digits: str, step: int) -> bool:
    if len(digits) < 3:
        return False
    nums = [int(ch) for ch in digits]
    for i in range(len(nums) - 2):
        if nums[i + 1] - nums[i] == step and nums[i + 2] - nums[i + 1] == step:
            return True
    return False


def _has_repeated_pair(text: str) -> bool:
    return any(text[i : i + 2] == text[i + 2 : i + 4] for i in range(len(text) - 3))


def _is_alternating_letter_digit(text: str) -> bool:
    if len(text) < 3:
        return False
    kinds = ["L" if ch.isalpha() else "D" for ch in text]
    return all(left != right for left, right in zip(kinds, kinds[1:]))


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
