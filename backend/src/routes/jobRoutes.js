const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const jobController = require("../controllers/jobController");

// Public routes
router.get("/", jobController.getAllJobs);
router.get("/:id", jobController.getJobById);

// Protected routes - All authenticated users
router.use(auth);

// Job seeker routes
router.post("/save", jobController.saveJob);
router.delete("/unsave", jobController.unsaveJob);
router.get("/saved/list", jobController.getSavedJobs);
router.get("/saved/check", jobController.checkSavedJobs);

// Employer only routes
router.use(requireRole("employer"));

// Employer job management
router.post("/", jobController.createJob);
router.get("/employer/my-jobs", jobController.getEmployerJobs);
router.put("/:id", jobController.updateJob);
router.delete("/:id", jobController.deleteJob);
router.patch("/:id/status", jobController.updateJobStatus);
router.get("/employer/stats", jobController.getJobStats);

module.exports = router;
