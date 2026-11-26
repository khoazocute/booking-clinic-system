from app.safety.pii import PiiSanitizer

sanitizer = PiiSanitizer()


def test_redacts_name_phone_and_email():
    result = sanitizer.sanitize("Tôi tên là Nguyễn Văn An, sđt 0912 345 678, email an.nguyen@gmail.com, bị ho")
    assert result.text == "Tôi tên là [NAME], sđt [PHONE], email [EMAIL], bị ho"
    assert result.redactions == {"NAME": 1, "PHONE": 1, "EMAIL": 1}


def test_redacts_identity_and_insurance_numbers():
    result = sanitizer.sanitize("CCCD 079203001234, thẻ BHYT DN4797915123456, gọi +84912345678")
    assert result.text == "CCCD [ID_NO], thẻ BHYT [INSURANCE_NO], gọi [PHONE]"


def test_keeps_clinical_numbers():
    text = "Huyết áp 160/100, sốt 38.5 độ, 3 tháng sụt 7kg, ho 2 tuần"
    result = sanitizer.sanitize(text)
    assert result.text == text
    assert result.redacted_count == 0


def test_does_not_treat_lowercase_words_as_a_name():
    assert sanitizer.sanitize("tôi tên là gì cũng được").text == "tôi tên là gì cũng được"
