import { apiClient } from "./apiClient";

/**
 * VNPay. The hash secret never reaches the browser: the backend signs the payment URL (with the amount
 * taken from the database) and verifies VNPay's signature on return. The browser only redirects.
 */
export async function createVnpayPaymentUrl(appointmentId) {
  const response = await apiClient("/payments/vnpay/url", {
    method: "POST",
    body: JSON.stringify({ appointmentId }),
  });
  return response?.data?.paymentUrl;
}

/** Sends the vnp_* query parameters back to the server, which decides whether the payment succeeded. */
export async function verifyVnpayReturn(searchParams) {
  const params = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("vnp_")) params[key] = value;
  });
  const response = await apiClient("/payments/vnpay/verify", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return response?.data;
}
