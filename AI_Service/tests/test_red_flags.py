"""Examples here are deliberately NOT taken from eval/data, so the eval stays an independent measurement."""

import pytest

from app.safety.red_flags import RedFlagDetector

detector = RedFlagDetector()


@pytest.mark.parametrize("message, category", [
    ("Mẹ tôi tự nhiên bị méo miệng và tay trái yếu hẳn", "STROKE"),
    ("đau ngực trái dữ dội, vã mồ hôi", "CARDIAC"),
    ("Tôi bị đau tức ngực kéo dài 20 phút, nghỉ không đỡ", "CARDIAC"),
    ("Ăn tôm xong sưng môi, khó thở", "ANAPHYLAXIS"),
    ("Bé bị sặc, môi tím tái", "BREATHING"),
    ("Chồng tôi ngất xỉu ở nhà", "ALTERED_CONSCIOUSNESS"),
    ("Ho ra máu từ sáng", "SEVERE_BLEEDING"),
    ("Có bầu 30 tuần, bị vỡ ối", "PREGNANCY"),
    ("Đau bụng quặn quại không đứng thẳng được", "ACUTE_ABDOMEN"),
    ("đau bụng kinh khủng, quặn quại", "ACUTE_ABDOMEN"),
    ("Con tôi 1 tháng tuổi bị sốt", "INFANT_OR_HIGH_FEVER"),
    ("Ngã cầu thang, đập đầu, giờ cứ nôn", "HEAD_TRAUMA"),
    ("đau đầu đột ngột dữ dội nhất từ trước tới giờ", "SEVERE_HEADACHE"),
    ("Tôi muốn tự tử", "SELF_HARM"),
    ("toi muon tu tu", "SELF_HARM"),  # typed without accents: cannot be told apart from "từ từ", so escalate
])
def test_detects_emergencies(message, category):
    flag = detector.detect(message)
    assert flag is not None, message
    assert flag.category == category
    assert "115" in flag.message


@pytest.mark.parametrize("message", [
    "Tôi bị nghẹt mũi, ngạt mũi 3 ngày",        # "ngạt" != "ngất"
    "Đau bụng kinh dữ dội mỗi tháng",           # recurring menstrual pain
    "Con đi cầu đến 5 lần mỗi ngày",            # "đến" != "đen"
    "Bạn cứ từ từ kể triệu chứng",              # "từ từ" typed with accents is not "tự tử"
    "Tôi hay bị đau đầu nhẹ vào buổi chiều",
    "Mỗi lần trời lạnh là thở khò khè",
    "Bé 12 tháng tuổi sốt 38 độ",
    "Tức ngực bên trái khi gắng sức",
    "Mặt nổi mụn, ngứa",
    "",
])
def test_ignores_non_emergencies(message):
    assert detector.detect(message) is None
