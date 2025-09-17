const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const appCtrl = require("../controllers/applicationController");

// Apply to a job (jobseeker only)
router.post("/jobs/:jobId/apply", auth, requireRole("jobseeker"), appCtrl.apply);

module.exports = router;


