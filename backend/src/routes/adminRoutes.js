const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllJobs,
  updateJobStatus,
  deleteJob,
} = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole("admin"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Job management
router.get("/jobs", getAllJobs);
router.put("/jobs/:id/status", updateJobStatus);
router.delete("/jobs/:id", deleteJob);

module.exports = router;
