import pytest

from app.retrieval.base import Ranked, Specialty
from app.retrieval.rules import is_child_patient, prefer_pediatrics


@pytest.mark.parametrize("message", [
    "Bé nhà tôi bị sốt", "Con trai tôi 7 tuổi đau bụng", "Trẻ sơ sinh bị vàng da",
    "Em bé 9 tháng tuổi bị ho", "con gái 15 tuổi bị mụn",
])
def test_detects_child_patients(message):
    assert is_child_patient(message)


@pytest.mark.parametrize("message", [
    "Tôi 25 tuổi bị đau dạ dày", "3 tháng nay tôi sụt 7kg", "Con tôi 30 tuổi bị đau lưng",
    "Mẹ tôi 70 tuổi hay quên", "Tôi bị ho 2 tuần",
])
def test_ignores_adults_and_durations(message):
    assert not is_child_patient(message)


def test_moves_pediatrics_to_the_top_for_children_only():
    gi, peds = Specialty(9, "Tiêu hóa", ""), Specialty(7, "Nhi khoa", "")
    ranked = [Ranked(gi, 9.0), Ranked(peds, 4.0)]
    assert [r.specialty.id for r in prefer_pediatrics("Bé 2 tuổi tiêu chảy", ranked)] == [7, 9]
    assert [r.specialty.id for r in prefer_pediatrics("Tôi bị tiêu chảy", ranked)] == [9, 7]
