const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/investorController");

router.use(auth);

router.get("/overview", requireRole("investor"), ctrl.getOverview);
router.post("/invest", requireRole("investor"), ctrl.createInvestment);
router.get("/portfolio", requireRole("investor"), ctrl.getPortfolio);

module.exports = router;

