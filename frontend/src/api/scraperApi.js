const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

// Get scraping statistics
export async function getScrapingStats() {
  const res = await fetch(`${API_BASE}/scraper/stats`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch scraping stats");
  return res.json();
}

// Trigger manual scraping
export async function triggerScraping() {
  const res = await fetch(`${API_BASE}/scraper/trigger`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to trigger scraping");
  }
  return res.json();
}

// Start scheduler
export async function startScheduler() {
  const res = await fetch(`${API_BASE}/scraper/scheduler/start`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to start scheduler");
  }
  return res.json();
}

// Stop scheduler
export async function stopScheduler() {
  const res = await fetch(`${API_BASE}/scraper/scheduler/stop`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to stop scheduler");
  }
  return res.json();
}

// Get scheduler status
export async function getSchedulerStatus() {
  const res = await fetch(`${API_BASE}/scraper/scheduler/status`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch scheduler status");
  return res.json();
}

// Cleanup expired data
export async function cleanupExpiredData() {
  const res = await fetch(`${API_BASE}/scraper/cleanup`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to cleanup expired data");
  }
  return res.json();
}
