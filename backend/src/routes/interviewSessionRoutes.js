const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/interviewSessionController");

router.use(auth);

router.post("/", requireRole("employer", "admin"), ctrl.createSession);
router.get("/:id", ctrl.getSession);
router.patch("/:id/status", ctrl.updateStatus);

module.exports = router;
