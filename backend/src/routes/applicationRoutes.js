const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const appCtrl = require("../controllers/applicationController");

// Apply to a job (jobseeker only)
router.post("/jobs/:jobId/apply", auth, requireRole("jobseeker"), appCtrl.apply);

// Update application status (employer/admin only)
router.patch("/:applicationId/status", auth, requireRole("employer", "admin"), appCtrl.updateApplicationStatus);

// Get applications for a job (employer/admin only)
router.get("/jobs/:jobId", auth, requireRole("employer", "admin"), appCtrl.getJobApplications);

module.exports = router;


