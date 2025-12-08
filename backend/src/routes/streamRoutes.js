const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const streamCtrl = require('../controllers/streamController');

// Generate Stream token (for authenticated users)
router.get('/token', auth, streamCtrl.generateToken);

// Create a call for a chat room
router.post('/calls/room/:roomId', auth, streamCtrl.createCall);

module.exports = router;

