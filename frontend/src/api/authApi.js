// Use same-origin /api in dev (Vite proxy) unless VITE_API_URL is set
const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function authHeaders() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function me() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function logoutUser() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { ...authHeaders() },
  });
}
