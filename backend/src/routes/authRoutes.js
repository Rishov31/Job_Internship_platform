const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const User = require("../models/User");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/me", auth.me);

router.get("/debug/count", async (req, res) => {
  if (process.env.ALLOW_DEBUG_ENDPOINTS !== "true") return res.status(404).end();
  const count = await User.countDocuments();
  res.json({ users: count });
});

module.exports = router;


