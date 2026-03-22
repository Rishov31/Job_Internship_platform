const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/mentorshipRequestController");

router.use(auth);

router.get("/investors", ctrl.listInvestors);

/** Provider lists before :id routes */
router.get(
  "/for-provider",
  requireRole("employer", "investor"),
  ctrl.listForProvider
);

router.post("/", requireRole("jobseeker"), ctrl.createRequest);
router.get("/me", requireRole("jobseeker"), ctrl.listMine);
router.post("/:id/pay", requireRole("jobseeker"), ctrl.payRequest);

router.patch(
  "/:id/reject",
  requireRole("employer", "investor"),
  ctrl.rejectRequest
);
router.patch(
  "/:id/propose-slot",
  requireRole("employer", "investor"),
  ctrl.proposeSlot
);

module.exports = router;
