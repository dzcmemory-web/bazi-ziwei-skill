"""Small five-element helpers used by the plate scoring prototype."""

from __future__ import annotations

from collections.abc import Iterable

ELEMENTS = ("木", "火", "土", "金", "水")

STEM_TO_ELEMENT = {
    "甲": "木",
    "乙": "木",
    "丙": "火",
    "丁": "火",
    "戊": "土",
    "己": "土",
    "庚": "金",
    "辛": "金",
    "壬": "水",
    "癸": "水",
}

PRODUCES = {
    "木": "火",
    "火": "土",
    "土": "金",
    "金": "水",
    "水": "木",
}

CONQUERS = {
    "木": "土",
    "土": "水",
    "水": "火",
    "火": "金",
    "金": "木",
}


def unique_elements(values: Iterable[str]) -> list[str]:
    """Return valid five-element names in original order without duplicates."""

    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value in ELEMENTS and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def stem_to_element(stem: str | None) -> str | None:
    if not stem:
        return None
    return STEM_TO_ELEMENT.get(stem)


def element_that_produces(element: str) -> str:
    for source, target in PRODUCES.items():
        if target == element:
            return source
    raise ValueError(f"Unknown element: {element}")


def element_that_conquers(element: str) -> str:
    for source, target in CONQUERS.items():
        if target == element:
            return source
    raise ValueError(f"Unknown element: {element}")


def favorable_by_strength(day_master_element: str, strength_verdict: str) -> tuple[list[str], list[str]]:
    """Simplified yong-shen direction from day-master strength.

    This mirrors the common rule also used in the tianji reference project:
    a strong day master prefers control/drain/wealth, and a weak day master
    prefers support/resource.
    """

    if "旺" in strength_verdict:
        favorable = [
            element_that_conquers(day_master_element),
            PRODUCES[day_master_element],
            CONQUERS[day_master_element],
        ]
        unfavorable = [element_that_produces(day_master_element), day_master_element]
    elif "弱" in strength_verdict:
        favorable = [element_that_produces(day_master_element), day_master_element]
        unfavorable = [
            element_that_conquers(day_master_element),
            PRODUCES[day_master_element],
            CONQUERS[day_master_element],
        ]
    else:
        favorable = [element_that_produces(day_master_element), day_master_element]
        unfavorable = []
    return unique_elements(favorable), unique_elements(unfavorable)
