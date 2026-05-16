const TMN_CODE = import.meta.env.VITE_VNPAY_TMN_CODE;
const HASH_SECRET = import.meta.env.VITE_VNPAY_HASH_SECRET;
const VNPAY_URL = import.meta.env.VITE_VNPAY_URL;

function formatVNDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

async function hmacSHA512(key, data) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Tạo VNPay payment URL (sandbox).
 * amount: VND (số nguyên, ví dụ 150000)
 * orderInfo: mô tả đơn hàng (ASCII, không dấu)
 * txnRef: mã giao dịch duy nhất (max 20 ký tự, alphanum)
 * returnUrl: URL trả về sau khi thanh toán
 */
export async function buildVNPayUrl({ amount, orderInfo, txnRef, returnUrl }) {
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: TMN_CODE,
    vnp_Amount: String(Math.round(amount) * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "billpayment",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: formatVNDate(new Date()),
  };

  const sortedKeys = Object.keys(params).sort();

  // Sign data: raw values, không encode (theo chuẩn VNPay Node.js demo)
  const signData = sortedKeys
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const hash = await hmacSHA512(HASH_SECRET, signData);

  // URL query string: encode để browser hiểu đúng
  const queryString = sortedKeys
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`)
    .join("&");

  return `${VNPAY_URL}?${queryString}&vnp_SecureHash=${hash}`;
}

/** Đọc params từ VNPay return URL và xác định kết quả */
export function parseVNPayReturn(searchParams) {
  const responseCode = searchParams.get("vnp_ResponseCode");
  const txnRef = searchParams.get("vnp_TxnRef");
  const amount = searchParams.get("vnp_Amount");
  const orderInfo = searchParams.get("vnp_OrderInfo");
  const transactionNo = searchParams.get("vnp_TransactionNo");
  const bankCode = searchParams.get("vnp_BankCode");
  const payDate = searchParams.get("vnp_PayDate");

  return {
    success: responseCode === "00",
    responseCode,
    txnRef,
    amount: amount ? Number(amount) / 100 : null,
    orderInfo,
    transactionNo,
    bankCode,
    payDate,
  };
}
