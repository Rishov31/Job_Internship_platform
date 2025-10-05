const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile } = require('../controllers/cloudinaryController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

// All Cloudinary routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

router.post('/upload', uploadFile);
router.post('/delete', deleteFile);

module.exports = router;
