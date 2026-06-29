"""BaZi preference adapter.

The primary path tries to reuse this repository's Node calculator. The fallback
is intentionally simple and clearly marked, so the CLI remains usable before
Node dependencies are installed.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass, field
from datetime import date, datetime, time
from pathlib import Path
from typing import Any

from .five_elements import (
    CONQUERS,
    PRODUCES,
    element_that_conquers,
    favorable_by_strength,
    stem_to_element,
    unique_elements,
)


@dataclass(frozen=True)
class BirthInfo:
    birth_date: date
    birth_time: time | None = None
    gender: str = "unknown"
    birth_place: str | None = None

    @property
    def has_unknown_time(self) -> bool:
        return self.birth_time is None


@dataclass(frozen=True)
class BaziProfile:
    day_master: str | None
    day_master_element: str
    favorable_elements: tuple[str, ...]
    unfavorable_elements: tuple[str, ...]
    missing_elements: tuple[str, ...] = ()
    strongest_elements: tuple[str, ...] = ()
    strength_verdict: str = "简化参考"
    confidence: str = "低"
    source: str = "heuristic"
    notes: tuple[str, ...] = field(default_factory=tuple)


def parse_birth_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("出生日期请使用 YYYY-MM-DD，例如 1990-05-12。") from exc


def parse_birth_time(value: str | None) -> time | None:
    if value is None or value.strip() in {"", "unknown", "未知", "不详"}:
        return None
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError as exc:
        raise ValueError("出生时间请使用 HH:MM，例如 08:30；未知时可填 unknown。") from exc


def normalize_gender(value: str | None) -> str:
    if not value:
        return "unknown"
    normalized = value.strip().lower()
    mapping = {
        "男": "male",
        "男性": "male",
        "m": "male",
        "male": "male",
        "女": "female",
        "女性": "female",
        "f": "female",
        "female": "female",
        "unknown": "unknown",
        "未知": "unknown",
        "不详": "unknown",
    }
    if normalized not in mapping:
        raise ValueError("性别请使用 male/female/unknown，或中文 男/女/未知。")
    return mapping[normalized]


def build_bazi_profile(birth: BirthInfo, calculator_dir: str | Path | None = None) -> BaziProfile:
    if birth.birth_time and birth.gender in {"male", "female"}:
        chart, error = _try_local_calculator(birth, calculator_dir)
        if chart:
            return profile_from_chart(chart, extra_notes=("使用本仓库 calculator 完整排盘生成五行偏好。",))
        fallback = _heuristic_profile(birth)
        return _append_note(fallback, f"完整排盘暂不可用，已退回简化参考：{error}")

    fallback = _heuristic_profile(birth)
    if birth.birth_time is None:
        return _append_note(fallback, "出生时间未知，无法排完整四柱，本次按日期季节做简化五行参考。")
    return _append_note(fallback, "性别未知，未调用当前 calculator，已按日期季节做简化五行参考。")


def profile_from_chart(chart: dict[str, Any], extra_notes: tuple[str, ...] = ()) -> BaziProfile:
    bazi = chart.get("bazi", {})
    day_master = bazi.get("dayMaster")
    if isinstance(bazi.get("day_master"), dict):
        day_master = day_master or bazi["day_master"].get("stem")
    day_master_element = stem_to_element(day_master)
    if not day_master_element:
        raise ValueError("排盘结果中缺少可识别的日主天干。")

    enrichment = bazi.get("enrichment", {})
    element_stats = enrichment.get("五行统计", {})
    missing = tuple(unique_elements(element_stats.get("missing", [])))
    strongest = tuple(unique_elements(element_stats.get("strongest", [])))
    tiao_hou_stems = enrichment.get("调候用神", [])
    tiao_hou_elements = unique_elements(
        element for stem in tiao_hou_stems if (element := stem_to_element(stem))
    )
    wang_shuai = enrichment.get("旺衰", {})
    verdict = wang_shuai.get("verdict", "中和")
    confidence = wang_shuai.get("confidence", "中")

    base_favorable, base_unfavorable = favorable_by_strength(day_master_element, verdict)
    favorable = unique_elements([*tiao_hou_elements, *missing, *base_favorable])
    unfavorable = unique_elements(
        element for element in [*base_unfavorable, *strongest] if element not in favorable
    )

    notes = [
        f"日主为{day_master}{day_master_element}，旺衰判断为{verdict}。",
        f"调候/缺失/旺衰共同得到喜用参考：{'、'.join(favorable) or '无'}。",
    ]
    if missing:
        notes.append(f"表层五行缺：{'、'.join(missing)}。")
    if strongest:
        notes.append(f"表层偏旺五行：{'、'.join(strongest)}。")

    return BaziProfile(
        day_master=day_master,
        day_master_element=day_master_element,
        favorable_elements=tuple(favorable),
        unfavorable_elements=tuple(unfavorable),
        missing_elements=missing,
        strongest_elements=strongest,
        strength_verdict=verdict,
        confidence=confidence,
        source="calculator",
        notes=tuple([*extra_notes, *notes]),
    )


def _try_local_calculator(
    birth: BirthInfo, calculator_dir: str | Path | None
) -> tuple[dict[str, Any] | None, str | None]:
    base = Path(calculator_dir) if calculator_dir else Path.cwd() / "calculator"
    script = base / "dist" / "run-chart.js"
    if not script.exists():
        return None, f"未找到 {script}"

    assert birth.birth_time is not None
    cmd = [
        "node",
        str(script),
        f"--year={birth.birth_date.year}",
        f"--month={birth.birth_date.month}",
        f"--day={birth.birth_date.day}",
        f"--hour={birth.birth_time.hour}",
        f"--minute={birth.birth_time.minute}",
        f"--gender={birth.gender}",
    ]
    try:
        completed = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=20,
        )
        return json.loads(completed.stdout), None
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr or ""
        if "Cannot find module 'lunar-typescript'" in stderr:
            return None, "calculator 依赖未安装，请先运行：cd calculator && npm install"
        return None, stderr.strip().splitlines()[-1] if stderr.strip() else str(exc)
    except json.JSONDecodeError as exc:
        return None, f"calculator 输出不是合法 JSON：{exc}"
    except FileNotFoundError:
        return None, "未找到 node 命令，请先安装 Node.js >= 18"
    except subprocess.SubprocessError as exc:
        return None, str(exc)


def _heuristic_profile(birth: BirthInfo) -> BaziProfile:
    season_element = _season_element(birth.birth_date.month)
    favorable = unique_elements([element_that_conquers(season_element), PRODUCES[season_element]])
    unfavorable = unique_elements([season_element, CONQUERS[season_element]])
    notes = (
        f"简化参考：按公历月份估计季节五行为{season_element}。",
        f"为平衡季节偏性，优先参考{'、'.join(favorable)}，减少{'、'.join(unfavorable)}过重。",
    )
    return BaziProfile(
        day_master=None,
        day_master_element=season_element,
        favorable_elements=tuple(favorable),
        unfavorable_elements=tuple(unfavorable),
        strongest_elements=(season_element,),
        strength_verdict="季节简化参考",
        confidence="低",
        source="heuristic",
        notes=notes,
    )


def _season_element(month: int) -> str:
    # Approximate Gregorian mapping for a prototype. Complete BaZi should use
    # solar terms through the repository calculator.
    return {
        1: "水",
        2: "木",
        3: "木",
        4: "土",
        5: "火",
        6: "火",
        7: "土",
        8: "金",
        9: "金",
        10: "土",
        11: "水",
        12: "水",
    }[month]


def _append_note(profile: BaziProfile, note: str) -> BaziProfile:
    return BaziProfile(
        day_master=profile.day_master,
        day_master_element=profile.day_master_element,
        favorable_elements=profile.favorable_elements,
        unfavorable_elements=profile.unfavorable_elements,
        missing_elements=profile.missing_elements,
        strongest_elements=profile.strongest_elements,
        strength_verdict=profile.strength_verdict,
        confidence=profile.confidence,
        source=profile.source,
        notes=(*profile.notes, note),
    )
