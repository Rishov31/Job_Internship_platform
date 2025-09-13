const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

// Get all jobs with filters
export async function getAllJobs(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/jobs?${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

// Get job by ID
export async function getJobById(id) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

// Create new job (employer only)
export async function createJob(jobData) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(jobData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create job");
  }
  return res.json();
}

// Get employer's jobs
export async function getEmployerJobs(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/jobs/employer/my-jobs?${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch employer jobs");
  return res.json();
}

// Update job
export async function updateJob(id, jobData) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(jobData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update job");
  }
  return res.json();
}

// Delete job
export async function deleteJob(id) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete job");
  }
  return res.json();
}

// Update job status
export async function updateJobStatus(id, status) {
  const res = await fetch(`${API_BASE}/jobs/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update job status");
  }
  return res.json();
}

// Get job statistics
export async function getJobStats() {
  const res = await fetch(`${API_BASE}/jobs/employer/stats`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch job stats");
  return res.json();
}
