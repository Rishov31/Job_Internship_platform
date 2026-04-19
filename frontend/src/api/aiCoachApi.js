const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function authHeaders() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function chatWithAiCoach({ message, history = [] }) {
  const res = await fetch(`${API_BASE}/jobseeker/ai-coach/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Unable to get AI guidance (${res.status})`);
  }
  return data;
}
