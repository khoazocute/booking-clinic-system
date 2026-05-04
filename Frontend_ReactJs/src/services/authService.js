import { apiClient } from "./apiClient";

const ACCESS_TOKEN_KEY = "accessToken";

export function register(payload) {
  return apiClient("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser() {
  return apiClient("/auth/me");
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function extractAccessToken(response) {
  return (
    response?.data?.accessToken ??
    response?.accessToken ??
    response?.data?.token ??
    response?.token ??
    null
  );
}
