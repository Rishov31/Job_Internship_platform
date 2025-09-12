const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const userController = require("../controllers/userController");

// Current authenticated user
router.get("/me", auth, userController.getMe);
router.patch("/me", auth, userController.updateMe);

// Admin-only: list users
router.get("/", auth, requireRole("admin"), userController.listUsers);

module.exports = router;


