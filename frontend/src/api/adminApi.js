const API_BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Dashboard Stats
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};

// User Management
export const getAllUsers = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const updateUser = async (userId, userData) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
};

export const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete user');
  return response.json();
};

// Job Management
export const getAllJobs = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/admin/jobs?${queryParams}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
};

export const updateJobStatus = async (jobId, status) => {
  const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update job status');
  return response.json();
};

export const deleteJob = async (jobId) => {
  const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete job');
  return response.json();
};
