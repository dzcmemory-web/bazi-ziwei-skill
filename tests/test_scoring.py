import copy
from datetime import date, time

import pytest

from license_plate_bazi.bazi_adapter import (
    BaziProfile,
    BirthInfo,
    build_bazi_profile,
    parse_birth_time,
    profile_from_chart,
)
from license_plate_bazi.explainer import render_markdown
from license_plate_bazi.five_elements import (
    CONQUERS,
    PRODUCES,
    element_that_conquers,
    element_that_produces,
)
from license_plate_bazi.plate_parser import PlateParseError
from license_plate_bazi.rules import RuleConfigError, load_rules
from license_plate_bazi.scoring import recommendation_level, score_plates


@pytest.fixture
def profile():
    return BaziProfile(
        day_master="庚",
        day_master_element="金",
        favorable_elements=("土", "金"),
        unfavorable_elements=("火",),
        missing_elements=("土",),
        strongest_elements=("火",),
        strength_verdict="偏弱",
        confidence="高",
        source="test",
        notes=("测试用 profile",),
    )


def test_digit_five_element_mapping():
    rules = load_rules()
    assert rules["digit_five_elements"]["8"] == "土"
    assert rules["digit_five_elements"]["6"] == "金"
    assert rules["digit_five_elements"]["9"] == "火"


def test_letter_five_element_mapping():
    rules = load_rules()
    assert rules["letter_five_elements"]["A"] == "木"
    assert rules["letter_five_elements"]["Z"] == "金"
    assert rules["letter_five_elements"]["Q"] == "土"


def test_five_element_cycles():
    assert PRODUCES["金"] == "水"
    assert CONQUERS["水"] == "火"
    assert element_that_produces("金") == "土"
    assert element_that_conquers("金") == "火"


def test_scores_are_sorted_descending(profile):
    scores = score_plates(["粤B8A68Z", "粤B52088", "粤B3M96Q"], profile)
    totals = [item.score for item in scores]
    assert totals == sorted(totals, reverse=True)


def test_scores_stay_in_0_to_100(profile):
    scores = score_plates(["粤B88888", "粤B44444", "粤B3M96Q"], profile)
    assert all(0 <= item.score <= 100 for item in scores)


def test_breakdown_sum_matches_total_score(profile):
    score = score_plates(["粤B8A68Z"], profile)[0]
    assert score.breakdown.total == score.score


def test_scoring_is_stable(profile):
    first = score_plates(["粤B8A68Z", "粤B52088"], profile)
    second = score_plates(["粤B8A68Z", "粤B52088"], profile)
    assert [(x.plate.normalized, x.score, x.level) for x in first] == [
        (x.plate.normalized, x.score, x.level) for x in second
    ]


def test_same_input_repeat_markdown_is_identical(profile):
    birth = BirthInfo(date(1990, 5, 12), time(8, 30), "female")
    scores_1 = score_plates(["粤B8A68Z", "粤B52088"], profile)
    scores_2 = score_plates(["粤B8A68Z", "粤B52088"], profile)
    assert render_markdown(scores_1, birth, profile) == render_markdown(scores_2, birth, profile)


def test_prefix_match_scores_better_than_mismatch(profile):
    match = score_plates(["粤B8A68Z"], profile, current_prefix="粤B")[0]
    mismatch = score_plates(["粤B8A68Z"], profile, current_prefix="京A")[0]
    assert match.breakdown.aesthetic_memory > mismatch.breakdown.aesthetic_memory


def test_bad_homophone_penalty_adds_conflict(profile):
    score = score_plates(["粤B25088"], profile)[0]
    assert score.breakdown.homophone_safety < 10
    assert any("250" in reason or "负面" in reason for reason in score.reasons)
    assert score.conflicts


def test_empty_candidate_list_raises(profile):
    with pytest.raises(PlateParseError, match="不能为空"):
        score_plates([], profile)


def test_illegal_plate_raises(profile):
    with pytest.raises(PlateParseError, match="格式不支持"):
        score_plates(["BAD"], profile)


def test_unknown_birth_time_profile_is_low_confidence():
    birth = BirthInfo(birth_date=date(1990, 5, 12), birth_time=None, gender="unknown")
    profile = build_bazi_profile(birth)
    assert profile.source == "heuristic"
    assert profile.confidence == "低"
    assert any("出生时间未知" in note for note in profile.notes)


def test_parse_birth_time_unknown_values():
    assert parse_birth_time("unknown") is None
    assert parse_birth_time("未知") is None


def test_parse_birth_time_invalid_format():
    with pytest.raises(ValueError, match="出生时间请使用 HH:MM"):
        parse_birth_time("8点半")


def test_birth_time_missing_stays_stable():
    birth = BirthInfo(birth_date=date(1988, 11, 3), birth_time=None, gender="male")
    first = build_bazi_profile(birth)
    second = build_bazi_profile(birth)
    assert first == second


def test_profile_from_chart_uses_chart_elements():
    chart = {
        "bazi": {
            "dayMaster": "戊",
            "enrichment": {
                "五行统计": {
                    "missing": ["金"],
                    "strongest": ["火", "土"],
                },
                "调候用神": ["丙", "甲"],
                "旺衰": {"verdict": "偏弱", "confidence": "中"},
            },
        }
    }
    profile = profile_from_chart(chart)
    assert profile.day_master_element == "土"
    assert "金" in profile.favorable_elements
    assert profile.confidence == "中"


def test_favorable_plate_scores_above_unfavorable(profile):
    favorable = score_plates(["粤B88886"], profile)[0]
    unfavorable = score_plates(["粤B99994"], profile)[0]
    assert favorable.score > unfavorable.score


def test_recommendation_level_boundaries():
    rules = load_rules()
    assert recommendation_level(85, rules) == "强推荐"
    assert recommendation_level(84.99, rules) == "可选"
    assert recommendation_level(70, rules) == "可选"
    assert recommendation_level(69.99, rules) == "一般"
    assert recommendation_level(55, rules) == "一般"
    assert recommendation_level(54.99, rules) == "不建议"


def test_score_clamps_to_100_with_custom_rules(profile):
    rules = load_rules()
    custom = copy.deepcopy(rules)
    custom["digit_luck"]["base"] = 999
    score = score_plates(["粤B88888"], profile, rules=custom)[0]
    assert score.score <= 100


def test_score_clamps_to_0_with_custom_rules(profile):
    rules = load_rules()
    custom = copy.deepcopy(rules)
    custom["digit_luck"]["base"] = -999
    custom["bad_homophones"]["8"] = {"penalty": 999, "reason": "测试扣分"}
    score = score_plates(["粤B88888"], profile, rules=custom)[0]
    assert score.score >= 0


def test_missing_score_weight_reports_clear_rule_error(profile):
    rules = load_rules()
    custom = copy.deepcopy(rules)
    del custom["score_weights"]["bazi_match"]
    with pytest.raises(RuleConfigError, match="score_weights.bazi_match"):
        score_plates(["粤B88888"], profile, rules=custom)


def test_missing_letter_mapping_reports_clear_rule_error(profile):
    rules = load_rules()
    custom = copy.deepcopy(rules)
    del custom["letter_five_elements"]["Z"]
    with pytest.raises(RuleConfigError, match="缺少字母五行映射"):
        score_plates(["粤B8A68Z"], profile, rules=custom)


def test_missing_calculator_dependency_note_is_clear(tmp_path):
    calculator = tmp_path / "calculator"
    dist = calculator / "dist"
    dist.mkdir(parents=True)
    script = dist / "run-chart.js"
    script.write_text(
        "console.error(\"Error: Cannot find module 'lunar-typescript'\"); process.exit(1);",
        encoding="utf-8",
    )
    birth = BirthInfo(date(1990, 5, 12), time(8, 30), "female")
    profile = build_bazi_profile(birth, calculator_dir=calculator)
    assert profile.source == "heuristic"
    assert any("npm install" in note for note in profile.notes)
