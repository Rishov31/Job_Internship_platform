const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/startupController");

// Public / semi-public routes
router.get("/explore", ctrl.exploreStartups);
router.get("/:id/overview", ctrl.getStartupOverview);

// Authenticated founder routes
router.use(auth);
router.get("/me/completion", requireRole("employer"), ctrl.getStartupCompletion);
router.get("/me", requireRole("employer"), ctrl.getMyStartup);
router.post("/me", requireRole("employer"), ctrl.upsertMyStartup);
router.post("/me/funding", requireRole("employer"), ctrl.raiseFunding);
router.post("/me/repos", requireRole("employer"), ctrl.addRepository);

module.exports = router;

