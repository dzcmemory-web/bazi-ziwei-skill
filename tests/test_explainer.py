from datetime import date, time

from license_plate_bazi.bazi_adapter import BaziProfile, BirthInfo
from license_plate_bazi.explainer import render_markdown
from license_plate_bazi.scoring import score_plates


def _profile():
    return BaziProfile(
        day_master="庚",
        day_master_element="金",
        favorable_elements=("土", "金"),
        unfavorable_elements=("火",),
        missing_elements=("土",),
        strength_verdict="偏弱",
        confidence="高",
        source="test",
        notes=("测试用 profile",),
    )


def test_markdown_contains_title_and_disclaimer():
    birth = BirthInfo(date(1990, 5, 12), time(8, 30), "female")
    scores = score_plates(["粤B8A68Z"], _profile())
    markdown = render_markdown(scores, birth, _profile())
    assert "# 车牌推荐结果" in markdown
    assert "仅作传统文化和娱乐参考" in markdown


def test_markdown_contains_first_rank_plate():
    birth = BirthInfo(date(1990, 5, 12), time(8, 30), "female")
    scores = score_plates(["粤B8A68Z", "粤B52088"], _profile())
    markdown = render_markdown(scores, birth, _profile())
    assert "第1名" in markdown
    assert scores[0].plate.normalized in markdown


def test_markdown_shows_unknown_time():
    birth = BirthInfo(date(1990, 5, 12), None, "unknown")
    scores = score_plates(["粤B8A68Z"], _profile())
    markdown = render_markdown(scores, birth, _profile())
    assert "出生时间：未知" in markdown


def test_markdown_contains_breakdown_table():
    birth = BirthInfo(date(1990, 5, 12), time(8, 30), "female")
    scores = score_plates(["粤B8A68Z"], _profile())
    markdown = render_markdown(scores, birth, _profile())
    assert "| 八字喜用神匹配 |" in markdown
    assert "| 谐音和避雷项 |" in markdown


def test_markdown_does_not_use_absolute_predictions():
    birth = BirthInfo(date(1990, 5, 12), time(8, 30), "female")
    scores = score_plates(["粤B8A68Z"], _profile())
    markdown = render_markdown(scores, birth, _profile())
    forbidden = ["必发财", "保平安", "避免事故", "必然带来好运"]
    assert not any(text in markdown for text in forbidden)
