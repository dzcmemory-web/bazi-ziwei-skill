"""Markdown rendering for plate recommendations."""

from __future__ import annotations

from .bazi_adapter import BaziProfile, BirthInfo
from .scoring import PlateScore

DISCLAIMER = "结果仅作传统文化和娱乐参考，不具备科学预测效力，也不作为购车、上牌或其他实际决策依据。"


def render_markdown(scores: list[PlateScore], birth: BirthInfo, profile: BaziProfile) -> str:
    lines: list[str] = [
        "# 车牌推荐结果",
        "",
        "## 八字五行参考",
        f"- 出生日期：{birth.birth_date.isoformat()}",
        f"- 出生时间：{birth.birth_time.strftime('%H:%M') if birth.birth_time else '未知'}",
        f"- 性别：{birth.gender}",
        f"- 排盘来源：{profile.source}，置信度：{profile.confidence}",
        f"- 喜用参考：{'、'.join(profile.favorable_elements) or '无'}",
        f"- 避重参考：{'、'.join(profile.unfavorable_elements) or '无'}",
    ]
    if profile.day_master:
        lines.append(f"- 日主：{profile.day_master}{profile.day_master_element}")
    for note in profile.notes:
        lines.append(f"- {note}")

    lines.extend(["", "## 最终推荐排序"])
    for index, item in enumerate(scores, start=1):
        lines.extend(_render_score_item(index, item))

    lines.extend(["", f"注意：{DISCLAIMER}"])
    return "\n".join(lines)


def _render_score_item(index: int, item: PlateScore) -> list[str]:
    breakdown = item.breakdown
    lines = [
        "",
        f"### 第{index}名：{item.plate.normalized}",
        f"综合分：{item.score:.0f}/100",
        f"推荐等级：{item.level}",
        "",
        "| 评分项 | 得分 |",
        "|---|---:|",
        f"| 八字喜用神匹配 | {breakdown.bazi_match:.1f}/40 |",
        f"| 数字组合吉利度 | {breakdown.digit_luck:.1f}/25 |",
        f"| 字母组合匹配 | {breakdown.letter_match:.1f}/15 |",
        f"| 整体易记/美观 | {breakdown.aesthetic_memory:.1f}/10 |",
        f"| 谐音和避雷项 | {breakdown.homophone_safety:.1f}/10 |",
        "",
        "推荐理由：",
    ]
    for reason in item.reasons:
        lines.append(f"- {reason}")
    if item.conflicts:
        lines.extend(["", "冲突点："])
        for conflict in item.conflicts:
            lines.append(f"- {conflict}")
    return lines
