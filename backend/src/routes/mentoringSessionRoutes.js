const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/mentoringSessionController");

router.use(auth);

// Create a mentoring session (pending_payment)
router.post("/mentor/:mentorId", requireRole("jobseeker"), ctrl.createSession);

// Update payment status
router.patch("/:sessionId/payment", requireRole("jobseeker"), ctrl.updatePaymentStatus);

// Get my sessions (jobseeker)
router.get("/me", requireRole("jobseeker"), ctrl.getMySessions);

// Get my sessions as mentor / founder / investor (mentorUser match)
router.get(
  "/me/mentor",
  requireRole("mentor", "employer", "investor"),
  ctrl.getMySessionsAsMentor
);

// Get session by ID
router.get(
  "/:sessionId",
  requireRole("jobseeker", "mentor", "employer", "investor"),
  ctrl.getSessionById
);

module.exports = router;

