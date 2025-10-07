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


