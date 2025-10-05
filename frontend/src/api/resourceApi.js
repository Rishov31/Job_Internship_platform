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
  if (!response.ok) {
    let msg = 'Failed to fetch resources';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};

export const getResource = async (resourceId) => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);
  if (!response.ok) {
    let msg = 'Failed to fetch resource';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};

export const likeResource = async (resourceId, action = 'like') => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    let msg = 'Failed to like/unlike resource';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};

// Admin resource endpoints
export const getAdminResources = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/resources/admin/all?${queryParams}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    let msg = 'Failed to fetch admin resources';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};

export const createResource = async (resourceData) => {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(resourceData),
  });
  if (!response.ok) {
    let msg = 'Failed to create resource';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};

export const updateResource = async (resourceId, resourceData) => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(resourceData),
  });
  if (!response.ok) {
    let msg = 'Failed to update resource';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};

export const deleteResource = async (resourceId) => {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    let msg = 'Failed to delete resource';
    try {
      const err = await response.json();
      msg = `${response.status} ${response.statusText}: ${err?.message || msg}`;
    } catch (_) {
      msg = `${response.status} ${response.statusText}: ${msg}`;
    }
    throw new Error(msg);
  }
  return response.json();
};
