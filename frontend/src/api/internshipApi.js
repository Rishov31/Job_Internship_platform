const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

// Get all internships with filters
export async function getAllInternships(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/internships?${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch internships");
  return res.json();
}

// Get internship by ID
export async function getInternshipById(id) {
  const res = await fetch(`${API_BASE}/internships/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch internship");
  return res.json();
}

// Create new internship (employer only)
export async function createInternship(internshipData) {
  const res = await fetch(`${API_BASE}/internships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(internshipData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create internship");
  }
  return res.json();
}

// Get employer's internships
export async function getEmployerInternships(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/internships/employer/my-internships?${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch employer internships");
  return res.json();
}

// Update internship
export async function updateInternship(id, internshipData) {
  const res = await fetch(`${API_BASE}/internships/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(internshipData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update internship");
  }
  return res.json();
}

// Delete internship
export async function deleteInternship(id) {
  const res = await fetch(`${API_BASE}/internships/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete internship");
  }
  return res.json();
}

// Update internship status
export async function updateInternshipStatus(id, status) {
  const res = await fetch(`${API_BASE}/internships/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update internship status");
  }
  return res.json();
}

// Get internship statistics
export async function getInternshipStats() {
  const res = await fetch(`${API_BASE}/internships/employer/stats`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch internship stats");
  return res.json();
}
