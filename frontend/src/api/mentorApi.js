export async function listMentors(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/mentors${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch mentors");
  return res.json();
}

export async function getMentor(id) {
  const res = await fetch(`/api/mentors/${id}`);
  if (!res.ok) throw new Error("Failed to fetch mentor");
  return res.json();
}

export async function getMyMentorProfile() {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentors/me/profile`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch mentor profile");
  return res.json();
}

export async function upsertMyMentorProfile(payload) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentors/me/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save mentor profile");
  return res.json();
}

export async function createBooking(mentorId, payload) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/bookings/mentor/${mentorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to create booking");
  }
  return data;
}

export async function listMyBookingsAsMentor() {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/bookings/me/mentor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch mentor bookings");
  return res.json();
}

export async function listMyBookingsAsJobSeeker() {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/bookings/me/jobseeker`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch jobseeker bookings");
  return res.json();
}

// Mentoring Session APIs
export async function createMentoringSession(mentorId, payload) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentoring-sessions/mentor/${mentorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to create mentoring session");
  }
  return data;
}

export async function updatePaymentStatus(sessionId, paymentData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentoring-sessions/${sessionId}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(paymentData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to update payment status");
  }
  return data;
}

export async function getMyMentoringSessions() {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentoring-sessions/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch mentoring sessions");
  return res.json();
}

export async function getMentoringSession(sessionId) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentoring-sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch mentoring session");
  return res.json();
}

export async function getMyMentoringSessionsAsMentor() {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/mentoring-sessions/me/mentor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch mentor sessions");
  return res.json();
}

// Chat APIs
export async function getMyChatRooms() {
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${API_BASE}/chat/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch chat rooms");
  }
  return res.json();
}

export async function getChatRoom(roomId) {
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch chat room");
  }
  return res.json();
}

export async function getMessages(roomId, params = {}) {
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/chat/rooms/${roomId}/messages${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch messages");
  }
  return res.json();
}

export async function sendMessage(roomId, content, messageType = "text", fileUrl = null) {
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${API_BASE}/chat/rooms/${roomId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: JSON.stringify({ content, messageType, fileUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to send message");
  }
  return data;
}


