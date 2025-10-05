// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; // Replace with your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset'; // Replace with your upload preset

export const uploadToCloudinary = async (file, type = 'video') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    
    // Set folder based on type
    const folder = type === 'video' ? 'job-platform/videos' : 'job-platform/thumbnails';
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${
        type === 'video' ? 'video' : 'image'
      }/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      duration: data.duration || null, // For videos
      thumbnail: data.thumbnail_url || null, // For videos
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
