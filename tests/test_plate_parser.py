import pytest

from license_plate_bazi.plate_parser import PlateParseError, parse_plate, parse_plates


def test_parse_standard_mixed_plate():
    plate = parse_plate("粤B8A68Z")
    assert plate.province == "粤"
    assert plate.area_code == "B"
    assert plate.serial == "8A68Z"
    assert plate.digits == ("8", "6", "8")
    assert plate.letters == ("A", "Z")


def test_parse_digit_only_serial():
    plate = parse_plate("粤B52088")
    assert plate.prefix == "粤B"
    assert plate.digits == ("5", "2", "0", "8", "8")
    assert plate.letters == ()


def test_parse_lowercase_plate_normalizes():
    plate = parse_plate("粤b3m96q")
    assert plate.normalized == "粤B3M96Q"
    assert plate.letters == ("M", "Q")


def test_parse_removes_spaces():
    plate = parse_plate(" 粤 B 8A68Z ")
    assert plate.normalized == "粤B8A68Z"


def test_parse_new_energy_length_supported():
    plate = parse_plate("粤BD12345")
    assert plate.serial == "D12345"


def test_parse_new_energy_with_f_marker_supported():
    plate = parse_plate("粤BF12345")
    assert plate.normalized == "粤BF12345"
    assert plate.letters == ("F",)
    assert plate.digits == ("1", "2", "3", "4", "5")


def test_parse_digit_heavy_plate():
    plate = parse_plate("粤B12345")
    assert plate.digits == ("1", "2", "3", "4", "5")
    assert plate.letters == ()


def test_parse_letter_heavy_mixed_plate():
    plate = parse_plate("粤BABC1D")
    assert plate.letters == ("A", "B", "C", "D")
    assert plate.digits == ("1",)


def test_parse_mixed_letter_digit_plate():
    plate = parse_plate("粤B9K27M")
    assert plate.letters == ("K", "M")
    assert plate.digits == ("9", "2", "7")


def test_parse_plates_empty_raises_clear_error():
    with pytest.raises(PlateParseError, match="不能为空"):
        parse_plates([])


def test_rejects_bad_format():
    with pytest.raises(PlateParseError, match="格式不支持"):
        parse_plate("B12345")


def test_rejects_illegal_province_abbreviation():
    with pytest.raises(PlateParseError, match="省份简称不支持"):
        parse_plate("甲B12345")


def test_rejects_too_short_plate():
    with pytest.raises(PlateParseError, match="格式不支持"):
        parse_plate("粤B1234")


def test_rejects_too_long_plate():
    with pytest.raises(PlateParseError, match="格式不支持"):
        parse_plate("粤B1234567")


def test_rejects_forbidden_letter_i():
    with pytest.raises(PlateParseError, match="I 或 O"):
        parse_plate("粤B1I345")


def test_rejects_plate_without_digits():
    with pytest.raises(PlateParseError, match="至少需要包含一个数字"):
        parse_plate("粤BABCDE")
