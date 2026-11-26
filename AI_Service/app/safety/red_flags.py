"""Rule-based emergency ("red flag") detection.

Runs BEFORE any model call and does not depend on an LLM: it must work when the model is
down, must be deterministic, and must be unit-testable. The reply is a fixed template so a
model can never soften or rephrase emergency advice.

Rules are written from standard emergency warning-sign lists (chest pain features, FAST
stroke signs, airway/breathing, altered consciousness, major bleeding, obstetric bleeding,
acute abdomen, fever in infants < 3 months, major trauma, self-harm). They match on
accent-stripped text, so multi-word patterns are used to avoid Vietnamese accent
collisions (e.g. "ngạt mũi" vs "ngất", "đi cầu đến 5 lần" vs "phân đen").

Design choice: recall over precision. A false alarm costs one extra message; a miss can cost a life.
"""

import re
from dataclasses import dataclass, field

from app.text import has_diacritics, normalize

EMERGENCY_HEADER = (
    "⚠️ Các dấu hiệu bạn mô tả có thể là tình trạng CẤP CỨU. "
    "Hãy gọi ngay 115 hoặc đến khoa Cấp cứu của bệnh viện gần nhất, "
    "không chờ đặt lịch khám thông thường."
)
EMERGENCY_FOOTER = "Đây là hướng dẫn an toàn tự động, không thay thế đánh giá của nhân viên y tế."


@dataclass(frozen=True)
class Rule:
    category: str
    advice: str
    patterns: list[str]
    exclusions: list[str] = field(default_factory=list)
    # matched against the lower-cased ORIGINAL text, for phrases that collide once accents are stripped
    accented_patterns: list[str] = field(default_factory=list)
    # accent-stripped patterns only trusted when the user typed without any diacritics
    unaccented_only_patterns: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class RedFlag:
    category: str
    message: str


# Order matters: the first matching rule decides the category, so specific rules come first.
RULES: list[Rule] = [
    Rule(
        category="SELF_HARM",
        advice=(
            "Bạn không phải đối mặt với điều này một mình. Nếu bạn đang có ý định làm hại bản thân, "
            "hãy gọi 115 hoặc đến cơ sở y tế gần nhất ngay, và báo cho một người thân đang ở gần bạn."
        ),
        patterns=[
            r"\b(tu sat|khong muon song|chan song|ket lieu|tu hai ban than|cat tay|muon chet)\b",
            r"\b(uong|an)\b.{0,40}\bthi chet\b",
            r"\bnhay (lau|cau)\b",
        ],
        accented_patterns=[r"tự tử|tự sát"],
        unaccented_only_patterns=[r"\btu tu\b"],  # "tự tử" without accents == "từ từ" (slowly)
    ),
    Rule(
        category="ANAPHYLAXIS",
        advice="Nếu có bút tiêm adrenaline đã được kê, hãy dùng ngay. Tránh xa tác nhân gây dị ứng.",
        patterns=[
            r"\b(ong dot|di ung|soc phan ve)\b.{0,40}\b(kho tho|tho rit|sung (mat|moi|luoi|hong))\b",
            r"\bsung\b.{0,15}\b(mat|moi|luoi|co hong)\b.{0,30}\b(kho tho|tho rit|kho nuot)\b",
            r"\bsoc phan ve\b",
        ],
    ),
    Rule(
        category="STROKE",
        advice="Ghi lại thời điểm bắt đầu triệu chứng, đây là thông tin rất quan trọng. Không cho người bệnh ăn uống.",
        patterns=[
            r"\b(meo mieng|meo mat|liet nua nguoi|yeu nua nguoi|te nua nguoi|noi ngong|noi lap)\b",
            r"\bdot ngot\b.{0,30}\b(khong noi duoc|mat thi luc|yeu tay|yeu chan|mat thang bang)\b",
        ],
    ),
    Rule(
        category="CARDIAC",
        advice="Ngừng mọi hoạt động gắng sức, ngồi nghỉ, nới lỏng quần áo. Không tự lái xe đến viện.",
        patterns=[
            r"\bdau( that| tuc| nhoi)? nguc\b.{0,40}\b(du doi|lan (ra|xuong|len)|tay trai|canh tay|quai ham"
            r"|va mo hoi|mo hoi lanh|khong do|khong giam|\d+ phut)\b",
            r"\bnguc\b.{0,30}\b(de ep|bop nghet|bi de|that chat)\b",
        ],
    ),
    Rule(
        category="BREATHING",
        advice="Ngồi thẳng, giữ bình tĩnh, nới lỏng quần áo. Nếu có thuốc cắt cơn đã được bác sĩ kê, hãy dùng theo hướng dẫn.",
        patterns=[
            r"\bkho tho\b.{0,25}\b(du doi|dot ngot|khong noi duoc|tim tai|ngat)\b",
            r"\btim tai\b",
            r"\b(ngat tho|khong tho duoc|tho rit)\b",
        ],
    ),
    Rule(
        category="HEAD_TRAUMA",
        advice="Hạn chế di chuyển người bệnh, đặc biệt là vùng cổ.",
        patterns=[r"\b(nga|dap|va dap|chan thuong|tai nan)\b.{0,25}\bdau\b.{0,40}\b(non|lo mo|ngat|co giat|chay mau)\b"],
    ),
    Rule(
        category="ALTERED_CONSCIOUSNESS",
        advice="Đặt người bệnh nằm nghiêng an toàn, không nhét bất cứ thứ gì vào miệng, không cho ăn uống.",
        patterns=[
            r"\b(bat tinh|hon me|lo mo|goi khong tinh|khong tinh tao|mat y thuc|ngat xiu)\b",
            r"\bngat\b(?! (mui|tho))",
            r"\bco giat\b.{0,30}\b(khong tinh|lan dau|keo dai|\d+ phut|sot cao|lien tuc)\b",
            r"\bsot cao\b.{0,20}\bco giat\b",
        ],
    ),
    Rule(
        category="SEVERE_HEADACHE",
        advice="Không tự dùng thêm thuốc giảm đau để chờ đỡ.",
        patterns=[r"\bdau dau\b.{0,30}\b(du doi|nhu bua bo|kinh khung|chua tung|dot ngot)\b"],
    ),
    Rule(
        category="SEVERE_BLEEDING",
        advice="Không ăn uống thêm, nằm nghỉ. Nếu chảy máu ngoài da, ép chặt vết thương bằng vải sạch.",
        patterns=[
            r"\b(non|oi|ho|khac) ra mau\b",
            r"\bphan (co mau |mau )?den\b",
            r"\b(hac in|ba ca phe)\b",
            r"\bchay mau\b.{0,15}\b(nhieu|khong cam|khong ngung|khong dung)\b",
        ],
    ),
    Rule(
        category="PREGNANCY",
        advice="Nằm nghỉ nghiêng trái và đến ngay cơ sở sản khoa gần nhất.",
        patterns=[
            r"\b(mang thai|co thai|mang bau|co bau|thai \d+ (tuan|thang)|bau \d+ (tuan|thang))\b.{0,40}"
            r"\b(ra mau|chay mau|vo oi|ra nuoc oi|dau bung du doi|co giat|khong thay thai may)\b",
        ],
    ),
    Rule(
        category="ACUTE_ABDOMEN",
        advice="Không tự uống thuốc giảm đau hoặc ăn uống cho đến khi được bác sĩ khám.",
        patterns=[r"\bdau bung\b.{0,30}\b(du doi|quan quai|khong (di|dung|dung thang) (lai )?duoc|cung nhu go)\b"],
        # recurring menstrual pain is common and not an emergency on its own
        # ("kinh khung" = "terrible", so it must not trigger the menstrual exclusion)
        exclusions=[r"\b(dau bung kinh(?! khung)|hanh kinh|ky kinh|kinh nguyet|den thang)\b"],
    ),
    Rule(
        category="INFANT_OR_HIGH_FEVER",
        advice="Trẻ dưới 3 tháng tuổi bị sốt, hoặc sốt từ 40°C, cần được khám ngay kể cả khi trông vẫn tỉnh táo.",
        patterns=[
            r"\b(so sinh|[0-2] thang tuoi|duoi 3 thang|[1-9] tuan tuoi)\b.{0,30}\bsot\b",
            r"\bsot\b.{0,10}\b(4[0-2]|cao khong ha)\b",
        ],
    ),
    Rule(
        category="MAJOR_TRAUMA",
        advice="Giữ cố định vùng bị thương, không tự nắn chỉnh.",
        patterns=[
            r"\b(tai nan|nga|bi dam|bi chem)\b.{0,40}\b(bien dang|gay xuong|chay mau nhieu|khong cu dong duoc|bat tinh)\b",
            r"\b(xuong|chan|tay)\b.{0,15}\bbien dang\b",
        ],
    ),
]


class RedFlagDetector:
    def __init__(self, rules: list[Rule] = RULES):
        self._compiled = [
            (
                rule,
                [re.compile(p) for p in rule.patterns],
                [re.compile(p) for p in rule.exclusions],
                [re.compile(p) for p in rule.accented_patterns],
                [re.compile(p) for p in rule.unaccented_only_patterns],
            )
            for rule in rules
        ]

    def detect(self, message: str) -> RedFlag | None:
        plain = normalize(message)
        lowered = (message or "").lower()
        typed_without_accents = not has_diacritics(message or "")

        for rule, patterns, exclusions, accented, unaccented_only in self._compiled:
            if any(e.search(plain) for e in exclusions):
                continue
            hit = (
                any(p.search(plain) for p in patterns)
                or any(p.search(lowered) for p in accented)
                or (typed_without_accents and any(p.search(plain) for p in unaccented_only))
            )
            if hit:
                return RedFlag(rule.category, f"{EMERGENCY_HEADER}\n\n{rule.advice}\n\n{EMERGENCY_FOOTER}")
        return None
