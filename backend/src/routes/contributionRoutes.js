const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/contributionController");
const ghCtrl = require("../controllers/githubContributionController");

router.use(auth);

// Student routes
router.post("/", requireRole("jobseeker"), ctrl.createContribution);
router.get("/student/me", requireRole("jobseeker"), ctrl.listMyContributions);
router.get("/github/activity", requireRole("jobseeker"), ghCtrl.getGithubActivity);

// Startup founder routes
router.get("/startup/me", requireRole("employer"), ctrl.listStartupContributions);
router.post("/founder/award", requireRole("employer"), ctrl.founderAwardByGithub);

// Founder / admin can update contribution status
router.patch(
  "/:id/status",
  requireRole("employer", "admin"),
  ctrl.updateContributionStatus
);

module.exports = router;

