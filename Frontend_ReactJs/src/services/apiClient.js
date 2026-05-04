const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

export async function apiClient(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}
