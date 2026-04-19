const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function authHeaders() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCommunityMessages(before) {
  const qs = new URLSearchParams();
  if (before) qs.set("before", before);
  const res = await fetch(`${API_BASE}/community/messages?${qs}`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load messages");
  }
  return res.json();
}

export async function postCommunityMessage(content, isIdea) {
  const res = await fetch(`${API_BASE}/community/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, isIdea: Boolean(isIdea) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to send");
  return data;
}

export async function reactToMessage(messageId, type) {
  const res = await fetch(`${API_BASE}/community/messages/${messageId}/react`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ type }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to react");
  return data;
}

export async function fetchDmConversations() {
  const res = await fetch(`${API_BASE}/community/dm/conversations`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load conversations");
  }
  return res.json();
}

export async function getOrCreateDm(peerId) {
  const res = await fetch(`${API_BASE}/community/dm/conversations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ peerId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Could not open chat");
  return data;
}

export async function fetchDmMessages(conversationId) {
  const res = await fetch(
    `${API_BASE}/community/dm/conversations/${conversationId}/messages`,
    {
      credentials: "include",
      headers: { ...authHeaders() },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load messages");
  }
  return res.json();
}

export async function sendDmMessage(conversationId, content) {
  const res = await fetch(
    `${API_BASE}/community/dm/conversations/${conversationId}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ content }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to send");
  return data;
}
