const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/mentorController");

// Public
router.get("/", ctrl.listMentors);
router.get("/:id", ctrl.getMentorById);

// Mentor self profile
router.use(auth);
router.use(requireRole("mentor", "admin"));
router.get("/me/profile", ctrl.getMyProfile);
router.put("/me/profile", ctrl.upsertMyProfile);
router.patch("/me/profile", ctrl.upsertMyProfile);

module.exports = router;


