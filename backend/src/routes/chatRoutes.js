const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/chatController");

router.use(auth);

// Get all chat rooms for current user
router.get("/rooms", ctrl.getMyChatRooms);

// Get a specific chat room
router.get("/rooms/:roomId", ctrl.getChatRoom);

// Get messages for a chat room
router.get("/rooms/:roomId/messages", ctrl.getMessages);

// Send a message
router.post("/rooms/:roomId/messages", ctrl.sendMessage);

module.exports = router;

