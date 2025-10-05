const API_BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Public resource endpoints
export const getAllResources = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/resources?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch resources');
  return response.json();
};

export const getResource = async (resourceId) => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);
  if (!response.ok) throw new Error('Failed to fetch resource');
  return response.json();
};

export const likeResource = async (resourceId, action = 'like') => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ action }),
  });
  if (!response.ok) throw new Error('Failed to like/unlike resource');
  return response.json();
};

// Admin resource endpoints
export const getAdminResources = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/resources/admin/all?${queryParams}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch admin resources');
  return response.json();
};

export const createResource = async (resourceData) => {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(resourceData),
  });
  if (!response.ok) throw new Error('Failed to create resource');
  return response.json();
};

export const updateResource = async (resourceId, resourceData) => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(resourceData),
  });
  if (!response.ok) throw new Error('Failed to update resource');
  return response.json();
};

export const deleteResource = async (resourceId) => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete resource');
  return response.json();
};
