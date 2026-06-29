"""License plate parsing and validation."""

from __future__ import annotations

import re
from dataclasses import dataclass

PROVINCE_ABBREVIATIONS = set("京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领港澳")
FORBIDDEN_LETTERS = {"I", "O"}


class PlateParseError(ValueError):
    """Raised when a plate cannot be parsed as a supported mainland-style plate."""


@dataclass(frozen=True)
class LicensePlate:
    raw: str
    normalized: str
    province: str
    area_code: str
    serial: str
    letters: tuple[str, ...]
    digits: tuple[str, ...]

    @property
    def prefix(self) -> str:
        return f"{self.province}{self.area_code}"


_PLATE_RE = re.compile(r"^([\u4e00-\u9fff])([A-Z])([A-Z0-9]{5,6})$")


def normalize_plate(value: str) -> str:
    return re.sub(r"\s+", "", value or "").upper()


def parse_plate(value: str) -> LicensePlate:
    normalized = normalize_plate(value)
    match = _PLATE_RE.match(normalized)
    if not match:
        raise PlateParseError(
            f"车牌格式不支持：{value!r}。请使用类似 粤B8A68Z、粤B52088 的格式。"
        )

    province, area_code, serial = match.groups()
    if province not in PROVINCE_ABBREVIATIONS:
        raise PlateParseError(f"省份简称不支持：{province}。")
    all_letters = [area_code, *[ch for ch in serial if ch.isalpha()]]
    if any(ch in FORBIDDEN_LETTERS for ch in all_letters):
        raise PlateParseError("车牌中不支持字母 I 或 O，容易和数字 1 或 0 混淆。")
    if not any(ch.isdigit() for ch in serial):
        raise PlateParseError("车牌后缀至少需要包含一个数字，才能做数字五行评分。")

    return LicensePlate(
        raw=value,
        normalized=normalized,
        province=province,
        area_code=area_code,
        serial=serial,
        letters=tuple(ch for ch in serial if ch.isalpha()),
        digits=tuple(ch for ch in serial if ch.isdigit()),
    )


def parse_plates(values: list[str] | tuple[str, ...]) -> list[LicensePlate]:
    if not values:
        raise PlateParseError("候选车牌不能为空，请至少提供一个车牌。")
    return [parse_plate(value) for value in values]
