const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

// Apply to a job
export async function applyToJob(jobId, applicationData) {
  const res = await fetch(`${API_BASE}/applications/jobs/${jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(applicationData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to apply to job");
  }
  return res.json();
}

// Get user's applications
export async function getMyApplications(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/jobseeker/applications?${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

// Check if user has already applied to a job
export async function checkApplication(jobId, isScraped = false) {
  const queryString = new URLSearchParams({ isScraped: isScraped.toString() }).toString();
  const res = await fetch(`${API_BASE}/applications/jobs/${jobId}/check?${queryString}`, {
    credentials: "include",
  });
  if (!res.ok) return { applied: false };
  return res.json();
}

