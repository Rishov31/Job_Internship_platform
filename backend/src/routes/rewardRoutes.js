const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/rewardController");

router.use(auth);

router.post("/claim", requireRole("jobseeker"), ctrl.claimReward);
router.get("/me", requireRole("jobseeker"), ctrl.listMyClaims);
router.get("/startup/me", requireRole("employer"), ctrl.listStartupClaims);
router.patch("/:id/status", requireRole("employer"), ctrl.updateClaimStatus);

module.exports = router;
