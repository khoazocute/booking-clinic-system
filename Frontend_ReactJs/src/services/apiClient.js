export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8082/api/v1";

export function getWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.hash = "";
  return url.toString();
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setStoredAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? await response.json()
    : null;
}

function buildError(payload) {
  const validationErrors =
    payload?.data && typeof payload.data === "object"
      ? Object.values(payload.data).filter(Boolean)
      : [];

  const errorMessage =
    validationErrors.length > 0
      ? validationErrors.join("\n")
      : payload?.message ?? "Request failed";

  return new Error(errorMessage);
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("Session expired. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    clearStoredTokens();
    throw buildError(payload);
  }

  const newAccessToken = payload?.data?.accessToken ?? payload?.accessToken ?? null;

  if (!newAccessToken) {
    clearStoredTokens();
    throw new Error("Unable to refresh access token.");
  }

  setStoredAccessToken(newAccessToken);
  return newAccessToken;
}

export async function apiClient(path, options = {}) {
  const { skipAuthRefresh = false, headers: customHeaders, ...fetchOptions } = options;

  async function performRequest(accessTokenOverride) {
    const token = accessTokenOverride ?? getStoredAccessToken();

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...(fetchOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(customHeaders ?? {}),
      },
      ...fetchOptions,
    });

    const payload = await parseResponse(response);
    return { response, payload };
  }

  let { response, payload } = await performRequest();

  if (response.status === 401 && !skipAuthRefresh && getStoredRefreshToken()) {
    try {
      const nextAccessToken = await refreshAccessToken();
      ({ response, payload } = await performRequest(nextAccessToken));
    } catch (refreshError) {
      clearStoredTokens();
      throw refreshError;
    }
  }

  if (!response.ok) {
    throw buildError(payload);
  }

  return payload;
}
