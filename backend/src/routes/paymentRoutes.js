const express = require("express");
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/paymentController");

const router = express.Router();

router.use(auth);

router.post(
  "/mentoring/:sessionId/checkout",
  requireRole("jobseeker"),
  ctrl.createMentoringCheckoutSession
);
router.post(
  "/mentoring/:sessionId/confirm",
  requireRole("jobseeker"),
  ctrl.confirmMentoringPayment
);

router.get(
  "/mentoring/:sessionId/status",
  requireRole("jobseeker", "mentor", "employer", "investor"),
  ctrl.getMentoringPaymentStatus
);

router.post(
  "/investor/wallet/checkout",
  requireRole("investor"),
  ctrl.createInvestorWalletCheckout
);
router.post(
  "/investor/wallet/confirm",
  requireRole("investor"),
  ctrl.confirmInvestorWalletRecharge
);

module.exports = router;
