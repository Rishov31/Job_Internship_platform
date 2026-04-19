const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/jobSeekerController");
const aiCoachCtrl = require("../controllers/aiCoachController");

router.use(auth);
router.use(requireRole("jobseeker"));

router.get("/profile", ctrl.getProfile);
router.post("/profile", ctrl.upsertProfile);
router.patch("/profile/:section", ctrl.sectionUpdate);
router.post("/profile/resume", ctrl.uploadResume);
router.get("/profile/completion", ctrl.completion);
router.get("/applications", ctrl.myApplications);
router.post("/ai-coach/chat", aiCoachCtrl.chatWithAiCoach);

module.exports = router;


