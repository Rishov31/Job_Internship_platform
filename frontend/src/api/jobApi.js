const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function authHeaders() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Get all jobs with filters
export async function getAllJobs(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/jobs?${queryString}`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

// Get job by ID
export async function getJobById(id) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

// Create new job (employer only)
export async function createJob(jobData) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
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
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch employer jobs");
  return res.json();
}

// Update job
export async function updateJob(id, jobData) {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
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
    headers: { ...authHeaders() },
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
    headers: { "Content-Type": "application/json", ...authHeaders() },
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
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch job stats");
  return res.json();
}

// Save/Bookmark a job
export async function saveJob(jobId, isScraped = false) {
  const res = await fetch(`${API_BASE}/jobs/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ jobId, isScraped }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to save job");
  }
  return res.json();
}

// Remove saved job
export async function unsaveJob(jobId, isScraped = false) {
  const res = await fetch(`${API_BASE}/jobs/unsave`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ jobId, isScraped }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to remove saved job");
  }
  return res.json();
}

// Get user's saved jobs
export async function getSavedJobs(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/jobs/saved/list?${queryString}`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch saved jobs");
  return res.json();
}

// Check if jobs are saved by user
export async function checkSavedJobs(jobIds, isScraped = false) {
  const queryString = new URLSearchParams({
    jobIds: jobIds.join(","),
    isScraped: isScraped.toString(),
  }).toString();
  const res = await fetch(`${API_BASE}/jobs/saved/check?${queryString}`, {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to check saved jobs");
  return res.json();
}
