const cloudinary = require('../config/cloudinary');

// Upload file to Cloudinary
exports.uploadFile = async (req, res, next) => {
  try {
    const { file, folder, resource_type = 'auto' } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: folder || 'job-platform',
      resource_type,
      use_filename: true,
      unique_filename: true,
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      thumbnail: result.thumbnail_url || null,
      duration: result.duration || null,
    });
  } catch (error) {
    next(error);
  }
};

// Delete file from Cloudinary
exports.deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'No public ID provided' });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video', // Try video first, then auto
    });

    res.json({
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'File deleted successfully' : 'File not found',
    });
  } catch (error) {
    next(error);
  }
};
