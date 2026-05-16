import { useSearchParams, Link } from "react-router-dom";
import { parseVNPayReturn } from "../../services/vnpayService";

export function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const result = parseVNPayReturn(searchParams);

  const formattedAmount = result.amount != null
    ? Number(result.amount).toLocaleString("vi-VN") + " ₫"
    : "—";

  const formattedDate = result.payDate
    ? `${result.payDate.slice(6, 8)}/${result.payDate.slice(4, 6)}/${result.payDate.slice(0, 4)} ${result.payDate.slice(8, 10)}:${result.payDate.slice(10, 12)}`
    : "—";

  if (result.success) {
    return (
      <div className="vnpay-return-page">
        <div className="vnpay-return-card">
          <div className="vnpay-return-icon vnpay-return-icon--success">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <h2 className="vnpay-return-title">Thanh toán thành công!</h2>
          <p className="vnpay-return-sub">Giao dịch VNPay của bạn đã được xác nhận.</p>

          <div className="vnpay-return-info">
            <div className="vnpay-info-row">
              <span className="vnpay-info-row__label">Mã giao dịch</span>
              <span className="vnpay-info-row__val">{result.transactionNo ?? "—"}</span>
            </div>
            <div className="vnpay-info-row">
              <span className="vnpay-info-row__label">Mã đơn hàng</span>
              <span className="vnpay-info-row__val">{result.txnRef ?? "—"}</span>
            </div>
            <div className="vnpay-info-row">
              <span className="vnpay-info-row__label">Số tiền</span>
              <span className="vnpay-info-row__val" style={{ color: "var(--primary)", fontWeight: 700 }}>
                {formattedAmount}
              </span>
            </div>
            <div className="vnpay-info-row">
              <span className="vnpay-info-row__label">Ngân hàng</span>
              <span className="vnpay-info-row__val">{result.bankCode ?? "—"}</span>
            </div>
            <div className="vnpay-info-row">
              <span className="vnpay-info-row__label">Thời gian</span>
              <span className="vnpay-info-row__val">{formattedDate}</span>
            </div>
          </div>

          <div className="vnpay-return-actions">
            <Link className="mc-btn mc-btn--primary" to="/doctors">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const errorMessages = {
    "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.",
    "09": "Thẻ/tài khoản chưa đăng ký dịch vụ InternetBanking.",
    "10": "Xác thực thông tin thẻ/tài khoản quá 3 lần.",
    "11": "Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại.",
    "12": "Thẻ/tài khoản bị khóa.",
    "13": "Sai mật khẩu OTP. Vui lòng thực hiện lại.",
    "24": "Giao dịch bị hủy.",
    "51": "Tài khoản không đủ số dư.",
    "65": "Vượt hạn mức giao dịch trong ngày.",
    "75": "Ngân hàng thanh toán đang bảo trì.",
    "79": "Sai mật khẩu thanh toán quá số lần quy định.",
    "99": "Lỗi không xác định.",
  };

  const errMsg = errorMessages[result.responseCode] ?? `Giao dịch thất bại (Mã lỗi: ${result.responseCode}).`;

  return (
    <div className="vnpay-return-page">
      <div className="vnpay-return-card">
        <div className="vnpay-return-icon vnpay-return-icon--error">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            cancel
          </span>
        </div>

        <h2 className="vnpay-return-title">Thanh toán thất bại</h2>
        <p className="vnpay-return-sub">{errMsg}</p>

        <div className="vnpay-return-info">
          <div className="vnpay-info-row">
            <span className="vnpay-info-row__label">Mã lỗi</span>
            <span className="vnpay-info-row__val" style={{ color: "var(--error)" }}>
              {result.responseCode}
            </span>
          </div>
          {result.txnRef && (
            <div className="vnpay-info-row">
              <span className="vnpay-info-row__label">Mã đơn hàng</span>
              <span className="vnpay-info-row__val">{result.txnRef}</span>
            </div>
          )}
        </div>

        <div className="vnpay-return-actions">
          <Link className="mc-btn mc-btn--primary" to="/doctors">
            Thử lại
          </Link>
          <Link className="mc-btn mc-btn--outline" to="/">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
