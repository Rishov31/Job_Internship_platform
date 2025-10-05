// Use backend to handle Cloudinary upload (simpler and more secure)
const API_BASE_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api';

export const uploadToCloudinary = async (file, type = 'video') => {
  try {
    // Convert file to base64
    const toBase64 = (f) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    const base64File = await toBase64(file);

    // Set folder based on type
    const folder = type === 'video' ? 'job-platform/videos' : 'job-platform/thumbnails';
    const resource_type = type === 'video' ? 'video' : 'image';

    const response = await fetch(`${API_BASE_URL}/cloudinary/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ file: base64File, folder, resource_type }),
    });

    if (!response.ok) {
      let message = 'Upload failed';
      try {
        const err = await response.json();
        message = err?.message || message;
      } catch (_) {}
      throw new Error(message);
    }

    const data = await response.json();

    return {
      url: data.url,
      publicId: data.publicId,
      duration: data.duration || null,
      thumbnail: data.thumbnail || null,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cloudinary/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return response.json();
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};
