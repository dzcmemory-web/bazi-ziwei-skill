import copy
import json

import pytest

from license_plate_bazi.rules import RuleConfigError, load_rules, validate_rules


def test_default_rules_load_successfully():
    rules = load_rules()
    assert rules["score_weights"]["bazi_match"] == 40


def test_score_weights_must_sum_to_100():
    rules = load_rules()
    custom = copy.deepcopy(rules)
    custom["score_weights"]["bazi_match"] = 41
    with pytest.raises(RuleConfigError, match="总和必须等于 100"):
        validate_rules(custom)


def test_missing_digit_mapping_reports_clear_error():
    rules = load_rules()
    custom = copy.deepcopy(rules)
    del custom["digit_five_elements"]["9"]
    with pytest.raises(RuleConfigError, match="缺少数字五行映射"):
        validate_rules(custom)


def test_missing_digit_score_reports_clear_error():
    rules = load_rules()
    custom = copy.deepcopy(rules)
    del custom["digit_luck"]["digit_scores"]["8"]
    with pytest.raises(RuleConfigError, match="缺少数字民俗分"):
        validate_rules(custom)


def test_missing_pattern_reports_clear_error():
    rules = load_rules()
    custom = copy.deepcopy(rules)
    del custom["digit_luck"]["patterns"]["contains_888"]
    with pytest.raises(RuleConfigError, match="digit_luck.patterns.contains_888"):
        validate_rules(custom)


def test_missing_recommendation_level_shape_reports_clear_error():
    rules = load_rules()
    custom = copy.deepcopy(rules)
    custom["recommendation_levels"] = [{"min_score": 85}]
    with pytest.raises(RuleConfigError, match="min_score 和 level"):
        validate_rules(custom)


def test_load_rules_reports_source_path_for_bad_file(tmp_path):
    bad_rules = tmp_path / "rules.json"
    rules = load_rules()
    del rules["score_weights"]["digit_luck"]
    bad_rules.write_text(json.dumps(rules, ensure_ascii=False), encoding="utf-8")
    with pytest.raises(RuleConfigError, match=str(bad_rules)):
        load_rules(bad_rules)
