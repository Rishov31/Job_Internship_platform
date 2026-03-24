const API = "/api";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createInterviewSession(applicationId) {
  const r = await fetch(`${API}/interview-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    credentials: "include",
    body: JSON.stringify({ applicationId }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || "Failed to create session");
  return data;
}

export async function getInterviewSession(sessionId) {
  const r = await fetch(`${API}/interview-sessions/${sessionId}`, {
    headers: { ...authHeader() },
    credentials: "include",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || "Failed to load session");
  return data;
}

export async function updateInterviewSessionStatus(sessionId, status) {
  const r = await fetch(`${API}/interview-sessions/${sessionId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || "Failed to update");
  return data;
}
